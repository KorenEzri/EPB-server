import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { messageDoc } from "../../types";
const messageSchema: Schema = new mongoose.Schema({
  sender: String,
  kaki: Number,
  lala: Array,
});
messageSchema.plugin(uniqueValidator);
messageSchema.set("toJSON", {
  transform: (_: any, returnedObject: any) => {
    delete returnedObject.__v;
  },
});
export const MessageModel = mongoose.model<messageDoc>(
  "MessageModel",
  messageSchema
);
//
