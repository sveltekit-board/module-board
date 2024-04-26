import Board from "$lib/src/Board.js";

export async function load(){
    console.log(await Board.dropBoard('test'))
}