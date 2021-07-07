// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface movieOptions {
  options: {
    duration: number,
    views: number,
    movie: string,
    name: string
  }
}
// added at: Wed Jul 07 2021 13:59:44 GMT+0300 (Israel Daylight Time) 

// exports section
export interface movieDoc extends Document, movieOptions {}
// exports section end