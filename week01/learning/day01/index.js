import {get_encoding} from "tiktoken"


const encoderForGpt2=get_encoding("gpt2")

const encode=encoderForGpt2.encode("Hello From Gen ai")
console.log(encode)
const decodeToken=encoderForGpt2.decode(encode)

console.log(decodeToken)

console.log("Original", new TextDecoder().decode(decodeToken))