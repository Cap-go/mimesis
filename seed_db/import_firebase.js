module.exports = {
    path: 'improbable/plus.csv', // Your CSV file name
    firebase: {
        credential: 'firebase_admin.json', // Your service account file name
        collection: 'mode/improbable_plus/fr', // target Collection in Firestore
    },
    mapper: (dataFromCSV) => { // Mapper Method as optional field
        return dataFromCSV; // Return data for saving in Firestore
    }
}