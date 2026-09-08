day 12
graph db and cypher queries

what is graph db
what mean of in-memory db

graph have node and edgs
relation between two nodes called edgs

db type
sql and nosql
can i define a graph in sql db

relatino table/ mapping table

from id (user id)
to id (user id)
relation(string)

this is like graph


nosql
mappings
fromobject (aliceUser)
toObject {janeObject}
relations


graph is a data structer

why need graph
in memory
long term memoery
factual memory
epsiduic memory


in reality this is not easy to store memory in key value
in human brain not just work in key value pairs
in perferance used key value
but
in reality when you think about something and also come same unwanted thing are come


relation memory
connected memory

in real life each think connect to other think either directly connected or inderectry connected
if you think any think but this time you also think that are related to orginal think


graph memeory
need dbms
have sql and nosql

problem in sql
crons
too rigid
not able to used sql query
dynamic schema
multiple think are connected to lotes of think

problem in nosql
crons



for this all sloved
have graph db
there is no fixed schema
native nodes and edges
on file- graph
give special query
cypher query - bfs, dfs
 
match a: User{name:"alice"} -{:LIKES}->(:gf)      | select* from users as a where user.name='alice'
return a ;
give a nodes with alice

retun gf
give a node with jane



create user(name:"alice",age:30)
create alice->[:LIKES]->(User(name:Jane))


create not node
crete edse of nodes
delete nodes
upadte nodes



eg
CREATE Hotel (busineesName:'xyz)
create User {name:"alice"} - [:likes] ->Hotel {businessNAme:xyz}

MATCH(u:User{name:"alice"}-[:likes]->Hotel)
retur all hotes that alice likes hotes

plese make sure detials chapter of raph db cypher queries where explain all type all opation with example better way

undertsan
 neo4J
 login neo4j aure login
 also able to used in docker

 LLMS are very much trained on these cypher queries









 neo4j with node js
 Build applications with Neo4j and JavaScript
The Neo4j Javascript driver is the official library to interact with a Neo4j instance through a Javascript application.

At the hearth of Neo4j lies Cypher, the query language to interact with a Neo4j database. Although this guide does not require you to be a seasoned Cypher querier, it’s easier to focus on the Javascript-specific bits if you know some Cypher already. You will also get a gentle introduction to Cypher in these pages, but check out Getting started → Cypher for a more detailed walkthrough of graph databases modelling and querying if this is your first approach.

Install
Install the Neo4j Javascript driver with npm:

npm i neo4j-driver
More info on installing the driver

Connect to the database
Connect to a database by creating a Driver object and providing a URL and an authentication token. Once you have a Driver instance, use the .getServerInfo() method to ensure that a working connection can be established.

var neo4j = require('neo4j-driver');
(async () => {
  // URI examples: 'neo4j://localhost', 'neo4j+s://xxx.databases.neo4j.io'
  const URI = '<database-uri>'
  const USER = '<username>'
  const PASSWORD = '<password>'
  let driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD))
  const serverInfo = await driver.getServerInfo()
  console.log('Connection established')
  console.log(serverInfo)

  // Use the driver to run queries

  await driver.close()
})();
More info on connecting to a database

Create an example graph
Run a Cypher query with the method Driver.executeQuery(). Do not hardcode or concatenate parameters: use placeholders and specify the parameters as key-value pairs.

Create two Person nodes and a KNOWS relationship between them

let { records, summary } = await driver.executeQuery(`
  CREATE (a:Person {name: $name})
  CREATE (b:Person {name: $friendName})
  CREATE (a)-[:KNOWS]->(b)
  `,
  { name: 'Alice', friendName: 'David' },
  { database: '<database-name>' }
)
console.log(
  `Created ${summary.counters.updates().nodesCreated} nodes ` +
  `in ${summary.resultAvailableAfter} ms.`
)



also able to used with in docker 
