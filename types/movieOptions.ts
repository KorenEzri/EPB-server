// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface movieOptions {
  options: {
    actors: string[],
    duration: number,
    name: string,
    views: number
  }
}
// added at: Fri Jul 09 2021 21:25:51 GMT+0300 (Israel Daylight Time) 

// exports section
export interface movieDoc extends Document, movieOptions {}
// exports section end