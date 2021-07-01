// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface messageOptions {
  options: {
    content: string
  }
}
// added at: Wed Jun 30 2021 20:10:29 GMT+0300 (Israel Daylight Time) 

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end