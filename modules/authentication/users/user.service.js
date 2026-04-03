import {User} from "./user.model.js"

export async function getUsers() {
    try{
        const users = await User.find();
        return users;
    }catch(err){
        throw new Error("fout bij het ophalen van de users",err);
    }
}
export async function getUserById(id) {
    try {
        const user = await User.findById(id);
        if (!user) throw new Error("User niet gevonden");
        return user;
    } catch(err) {
        throw new Error("Fout bij het ophalen van de user: " , err.message);
    }
}