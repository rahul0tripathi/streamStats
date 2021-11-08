const ENV_HOST = location.protocol + '//' + location.host;
const flushAndRedirect = () => {
  localStorage.setItem('user_info', null);
  localStorage.setItem('app_token', null);
  window.location.replace(ENV_HOST);
};
const renderStreams = (order = 'ASC', token = null) => {
  axios
    .get(ENV_HOST + '/api/streams', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        order
      }
    })
    .then(response => {
        console.log(response.data.result.data.length)
        $('#streams-body').html('')
      if (response.data.result.data.length) {
        response.data.result.data.forEach(v => {
          $('#streams-body').append(`
                <tr>
              <td>${v.title}</td>
              <td>${v.viewer_count}</td>
              <td>${v.game_name}</td>
              <td>${v.metadata.user_name}</td>
            </tr>
                `);
        });
      }
    })
    .catch(err => {});
};
$(document).ready(function () {
  M.AutoInit();
  console.log(ENV_HOST);
  console.log('ready');
  $('#login-btn').attr(
    'href',
    `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=n6nuazeb1j2e8q5nlloxzuqzck4ega&redirect_uri=${ENV_HOST}/api/Oauth&scope=viewing_activity_read+openid`
  );
  let users_info = localStorage.getItem('user_info');
  console.log(users_info);
  if (users_info) {
    users_info = JSON.parse(users_info);
  }
  let token = localStorage.getItem('app_token');
  console.log(token);
  if (token && users_info) {
    axios
      .get(ENV_HOST + '/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          memory: true
        }
      })
      .then(response => {
        console.log(response.data);
        let responseData = response.data.result.data;
        M.toast({ html: `<p>${response.data.statusCode} : ${response.data.result.message}</p>` });
        if ((responseData || {}).allStreamStats) {
          let allStreamStats = responseData.allStreamStats;
          $('#odd_count_memory').text(allStreamStats.odd_count);
          $('#even_count_memory').text(allStreamStats.even_count);
          $('#median_count_memory').text(allStreamStats.median_view_count);
          $('#duplicate_count_memory').text(`${allStreamStats.duplicate_count}`);
        }
        if ((responseData || {}).statsByGame) {
          $('#game-stats-body').html('');
          Object.values(responseData.statsByGame).forEach(v => {
            $('#game-stats-body').append(`
                <tr>
              <td>${v.game_name}</td>
              <td>${v.total_stream_count}</td>
              <td>${v.max_view_count}</td>
            </tr>
                `);
          });
        }
      })
      .catch(err => {
        M.toast({ html: `<p>session expired</p>` });
        flushAndRedirect();
      });
    axios
      .get(ENV_HOST + '/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          memory: false
        }
      })
      .then(response => {
        console.log(response.data);
        let responseData = response.data.result.data;
        M.toast({ html: `<p>${response.data.statusCode} : ${response.data.result.message}</p>` });
        if ((responseData || {}).allStreamStats) {
          let allStreamStats = responseData.allStreamStats;
          $('#odd_count_db').text(allStreamStats.odd_count);
          $('#even_count_db').text(allStreamStats.even_count);
          $('#median_count_db').text(allStreamStats.median_view_count);
          $('#duplicate_count_db').text(`${allStreamStats.duplicate_count}`);
        }
      })
      .catch(err => {
        M.toast({ html: `<p>session expired</p>` });
        flushAndRedirect();
      });
    $('#username').text('Ola ' + users_info?.user_name + ' !');
    $('#login-btn').css('display', 'none');
    $('#username').css('display', 'inline');
    renderStreams('ASC', token);
    $('#asc').click(() => {
      renderStreams('ASC', token);
    });
    $('#desc').click(() => {
      renderStreams('DESC', token);
    });
  }
});
