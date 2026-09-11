const cypherCrudService = require('../services/cypherCrudService');

async function runCypherCrudDemo() {
  console.log('===============================================================');
  console.log('  📜 DEMO 02 — CYPHER CRUD OPERATIONS & PARAMETERIZED QUERIES');
  console.log('===============================================================\n');

  try {
    // 1. CREATE
    console.log('1️⃣ [CREATE Node] Adding new user "Frank"...');
    const newUser = await cypherCrudService.createUser({
      id: `usr_frank_${Date.now()}`,
      name: 'Frank',
      age: 32,
      role: 'Backend Developer',
    });
    console.log('   Created User Node:', newUser.node);

    // 2. MERGE
    console.log('\n2️⃣ [MERGE Node & Edge] Merging User "Alice" LIKES Hotel "Grand Plaza"...');
    const mergeResult = await cypherCrudService.mergeUserLikesHotel('Alice', {
      businessName: 'Grand Plaza',
      city: 'Paris',
      rating: 4.9,
    });
    console.log('   Merged Record:', mergeResult.records);

    // 3. READ with Filter
    console.log('\n3️⃣ [MATCH & Filter] Finding hotels liked by friends of "Alice"...');
    const friendsHotels = await cypherCrudService.findHotelsLikedByFriends('Alice');
    console.table(friendsHotels);

    // 4. UPDATE
    console.log('\n4️⃣ [SET & UPDATE] Updating Frank\'s role and setting :VipUser label...');
    if (newUser.node && newUser.node.id) {
      const updatedUser = await cypherCrudService.updateUserRoleAndAddLabel(
        newUser.node.id,
        'Principal AI Engineer',
        true
      );
      console.log('   Updated User:', updatedUser);
    }

    // 5. TRANSACTION
    console.log('\n5️⃣ [TRANSACTION executeWrite] Creating connection Alice -> Frank in a write transaction...');
    if (newUser.node && newUser.node.id) {
      const txRes = await cypherCrudService.transferUserConnectionTransactional(
        'usr_alice',
        newUser.node.id,
        'KNOWS'
      );
      console.log('   Transaction Completed:', txRes);
    }
  } catch (error) {
    console.error('❌ Demo 02 Error:', error.message);
  }
  console.log('===============================================================\n');
}

module.exports = { runCypherCrudDemo };

if (require.main === module) {
  runCypherCrudDemo().then(() => process.exit(0));
}
