import { db } from "./prisma";

export const checkUser = async (cognitoUser) => {
  try {
    if (!cognitoUser) {
      return null;
    }

    const loggedInUser = await db.user.findUnique({
      where: {
        cognitoUserId: cognitoUser.uid,
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    const email = cognitoUser.email;
    const name = cognitoUser.displayName || "User";

    if (!email) {
      console.error("No email found for user");
      return null;
    }

    const newUser = await db.user.create({
      data: {
        cognitoUserId: cognitoUser.uid,
        name: name,
        imageUrl: cognitoUser.photoURL || "",
        email: email,
      },
    });

    return newUser;
  } catch (error) {
    console.error("Error in checkUser:", error.message);
    return null;
  }
};
