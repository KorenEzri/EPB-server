// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface messageOptions {
  options: {
    sender: string,
    follows: string[],
    likes: number,
    content: string
  }
}
// added at: Tue Jun 29 2021 23:03:07 GMT+0300 (Israel Daylight Time) 

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end