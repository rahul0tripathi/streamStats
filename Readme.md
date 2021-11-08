# StreamStats

StreamStats shows the following latest statistics of the top streams on twitch.

-   Game Stats
	-  game's highest viewer count
	-  total number of streams currently present
- Top Stream stats
	-   Median amount of viewers for all streams
	-   Streams with an odd number of viewers
	-   Streams with an even number of viewers
    -   Streams with the same amount of viewers (Duplicate Streams)
      
- Top 100 which can be sorted in ascending and descending order 

## Setup
 - clone the repository 
 - setup env files at the core directory and scripts directory
 - start the process using `npm start`
## Authentication
StreamStats uses twitch OAuth to authenticate a user, the authentication flow is as follows 
	
 - Users request to log-in via twitch onto the platform, post which the request is redirected to twitch 0Auth end-point
- Upon Successful verification, a code is generated which is used by the server to [create and verify](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth#oauth-authorization-code-flow) access_token   
- Upon successful verification and generation access_token, the user is created in the database if not already present and a signed JWT token with an expiry of 1 hour is generated
- This token is used by the client to make API calls and if the token expires, the same flow is repeated  

# Stats
Stats are calculated in to ways 

 - In Memory
	 - the server uses a caching service to cache calculation results to prevent unnecessary  requests to the database 
	 - once the raw data is loaded into the memory, calculations are done to generated required values
 - From Database
	 - The server uses [Sequelize](https://sequelize.org/) ORM to create and manage and query database schemas.
	 - The Statistics are calculated using multiple raw queries
	 - The response of these raw queries are send over to the client   

# Jobs
 The server also includes a cron service which in an interval of 15 minutes updates the database with top 1000 streams and removes the excessive streams

## Notes
- The live endpoint uses a tunnel to enable `https` required by twitch 0Auth which might increase the API latency 
- Due to Caching there might me differences in the values present in memory and database when the seeding job is running which will be resolved once the cache time expires or the job finishes
- For any queries regarding the project mail me rahultripathidev@gmail.com

