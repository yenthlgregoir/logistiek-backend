import {User} from "./user.model.js"

export async function getUsers() {
    try{
        const users = await User.find();
        return users;
    }catch(err){
        throw new Error("fout bij het ophalen van de users",err);
    }
}