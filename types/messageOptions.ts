// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface messageOptions {
  options: {
    content: string,
    likes: number,
    followers: string[]
  }
}
// added at: Tue Jun 29 2021 08:10:07 GMT+0300 (Israel Daylight Time) 

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end