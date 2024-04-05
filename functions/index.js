const FirebaseConfig = require("./FirebaseConfig");
const { functions, firestore, storageBucket, admin } = FirebaseConfig;

exports.onCreateRecipe = functions.firestore
  .document("recipes/{recipeId}")
  .onCreate(async (snapshot) => {
    const countDocRef = firestore.collection("recipeCounts").doc("all");
    const countDoc = await countDocRef.get();

    if (countDoc.exists) {
      countDocRef.update({ count: admin.firestore.FieldValue.increment(1) });
    } else {
      countDocRef.set({ count: 1 });
    }

    const recipe = snapshot.data();

    if (recipe.isPublished) {
      const countDocPublishedRef = firestore
        .collection("recipeCounts")
        .doc("published");
      const countPublishedDoc = await countDocPublishedRef.get();

      if (countPublishedDoc.exists) {
        countDocPublishedRef.update({
          count: admin.firestore.FieldValue.increment(1),
        });
      } else {
        countDocPublishedRef.set({ count: 1 });
      }
    }
  });
