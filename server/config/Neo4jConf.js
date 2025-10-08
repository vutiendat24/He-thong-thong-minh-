require('dotenv').config()
const neo4j = require('neo4j-driver')

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
)

// Hàm test kết nối
async function testConnectNeo4j() {
  try {
    const session = driver.session()
    await session.run('RETURN 1') // test query
    console.log('✅ Connected to Neo4j')
    await session.close()
  } catch (err) {
    console.error('❌ Neo4j connection error:', err)
  }
}


module.exports = {driver, testConnectNeo4j}
