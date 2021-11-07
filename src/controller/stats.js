const { database } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const { formatResponse, unpackRawQueryToObject } = require('../../util');
const { modelFields, models } = require('../models');
const { streamFields } = require('../models/streams');
const Cache = require('../services/cache');
const helpers = {
  getEmptyGameStats: (game_id, game_name) => {
    return {
      total_stream_count: 0,
      max_view_count: 0,
      game_id,
      game_name
    };
  },
  allStreamStats: () => {
    return {
      odd_count: 0,
      even_count: 0,
      median_view_count: 0,
      duplicate_count: 0
    };
  },
  swap: (arr, indexA, indexB) => {
    [arr[indexA], arr[indexB]] = [arr[indexB], arr[indexA]];
  },
  findPartitionIndex: (array, start, end) => {
    let pivot = array[end];
    let partitionIndex = start;
    for (let i = start; i < end; i++) {
      if (array[i] < pivot) {
        helpers.swap(array, i, partitionIndex);
        partitionIndex++;
      }
    }
    helpers.swap(array, end, partitionIndex);
    return partitionIndex;
  },
  quickSort: (array, start, end) => {
    if (start < end) {
      let partitionIndex = helpers.findPartitionIndex(array, start, end);
      helpers.quickSort(array, partitionIndex + 1, end);
      helpers.quickSort(array, start, partitionIndex - 1);
    }
  }
};
const getGameStatsFromDatabase = () => {
  return database.query(
    `
      SELECT 
          Count(*) AS total_streams_count, 
          Max(viewer_count) AS max_view_count, 
          game_id, 
          Any_value(game_name) AS game_name 
      FROM 
          stream_stats.streams 
      GROUP BY 
          game_id;
  `,
    { type: QueryTypes.SELECT, nest: true }
  );
};
const getStreamStatsFromDatabase = () => {
  return new Promise((resolve, reject) => {
    let queries = [];
    queries.push(
      database.query(
        `
    SELECT 
        median.median_view_count as median_view_count, 
        counts.* 
    FROM 
    (
      SELECT 
        Avg(sorted.viewer_count) AS median_view_count 
      FROM 
        (
            SELECT 
                @view_rank := @view_rank + 1 AS view_rank, 
                viewer_count 
            FROM 
                stream_stats.streams 
            ORDER BY 
                viewer_count
            ) AS sorted 
        CROSS JOIN ( SELECT @view_rank := -1) as parameter
        WHERE 
            sorted.view_rank IN (
            Floor(@view_rank / 2), 
            Ceil(@view_rank / 2)
            )
        ) AS median, 
    (
      SELECT 
            Count(
            CASE WHEN viewer_count % 2 = 0 THEN id ELSE NULL end
            ) AS even_count, 
            Count(
            CASE WHEN viewer_count % 2 <> 0 THEN id ELSE NULL end
            ) AS odd_count 
        FROM 
            stream_stats.streams
        ) AS counts; 
      `,
        { type: QueryTypes.SELECT, nest: true }
      ),
      database.query(
        `
      SELECT 
         Sum(duplicate_views.count) as duplicate_count 
      FROM 
        (
            SELECT 
            Count(viewer_count) AS count 
            FROM 
            stream_stats.streams 
            GROUP BY 
            viewer_count 
            HAVING 
            Count(viewer_count) > 1
        ) as duplicate_views;
      `,
        { type: QueryTypes.SELECT, nest: true }
      )
    );
    Promise.all(queries)
      .then(results => {
        let { duplicate_count, median_view_count, even_count, odd_count } = unpackRawQueryToObject(results);
        resolve({ duplicate_count: parseFloat(duplicate_count), median_view_count: parseFloat(median_view_count), even_count, odd_count });
      })
      .catch(err => {
        reject(err);
      });
  });
};

const streamsCache = new Cache({
  source: () => {
    return new Promise((resolve, reject) => {
      models.streams
        .findAll({
          raw: true
        })
        .then(data => {
          resolve(data);
        })
        .catch(err => {
          reject(err);
        });
    });
  },
  ttl: 10000
});
const statsCache = new Cache({
  source: () => {
    return new Promise((resolve, reject) => {
      let statsByGame = {};
      let allStreamStats = helpers.allStreamStats();
      let view_counts = [];
      let view_count_map = {};
      streamsCache.data().then(streams => {
        for (let i = 0; i < streams.length; i++) {
          if (!statsByGame[streams[i][streamFields.game_id]]) {
            statsByGame[streams[i][streamFields.game_id]] = helpers.getEmptyGameStats(streams[i][streamFields.game_id], streams[i][streamFields.game_name]);
          }
          statsByGame[streams[i][streamFields.game_id]].total_stream_count += 1;
          if (statsByGame[streams[i][streamFields.game_id]].max_view_count < streams[i][streamFields.viewer_count]) {
            statsByGame[streams[i][streamFields.game_id]].max_view_count = streams[i][streamFields.viewer_count];
          }
          if (streams[i][streamFields.viewer_count] % 2 == 0) {
            allStreamStats.even_count += 1;
          } else {
            allStreamStats.odd_count += 1;
          }
          view_counts.push(streams[i][streamFields.viewer_count]);
          view_count_map[`${streams[i][streamFields.viewer_count]}`] = (view_count_map[`${streams[i][streamFields.viewer_count]}`] ?? 0) + 1;
        }
        helpers.quickSort(view_counts, 0, view_counts.length - 1);
        let mid = Math.floor(view_counts.length / 2);
        allStreamStats.median_view_count = view_counts.length % 2 !== 0 ? view_counts[mid] : (view_counts[mid - 1] + view_counts[mid]) / 2;
        allStreamStats.duplicate_count =
          view_counts.length -
          Object.values(view_count_map).reduce((uniqueCount, count) => {
            if (count === 1) {
              uniqueCount += 1;
            }
            return uniqueCount;
          }, 0);
        resolve({ statsByGame, allStreamStats });
      });
    });
  },
  ttl: 10000
});
const getStatsByGames = (req, res, next) => {
  if (req.query.memory) {
    statsCache
      .data()
      .then(stats => {
        res.send(formatResponse(200, stats, 'successfully fetched game stats'));
      })
      .catch(err => {
        res.send(formatResponse(500, null, err));
      });
  } else {
    getStreamStatsFromDatabase()
      .then(allStreamStats => {
        getGameStatsFromDatabase()
          .then(statsByGame => {
            res.send(formatResponse(200, { statsByGame, allStreamStats }, 'successfully fetched game stats'));
          })
          .catch(err => {
            console.log(err);
            res.send(formatResponse(500, null, err));
          });
      })
      .catch(err => {
        console.log(err);
        res.send(formatResponse(500, null, err));
      });
  }
};
const flushAll = () => {
  streamsCache.flush();
  statsCache.flush();
};
module.exports = {
  getStatsByGames,
  flushAll
};
