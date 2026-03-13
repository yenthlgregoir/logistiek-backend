import mongoose from "mongoose";
import {User} from "../models/User.js"

export async function getUsers() {
    try{
        const users = await User.find();
        return users;
    }catch(err){
        throw new Error(err);
    }
}