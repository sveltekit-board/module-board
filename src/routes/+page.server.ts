import Comment from "$lib/src/Comment.js"

export async function load(){
    const comment:Comment = await Comment.getComment('test') || await Comment.createComment('test');

    let a = await comment.write('asdasd', 1, {provider: 'test', providerId: 'test'});
    let c = await comment.write('asdasd', 1, {provider: 'test', providerId: 'test'}, 1, a.insertId);
    await comment.remove(a.insertId)

    /*
    for(const num of [1,2,3,4,5,6,7,8,9,10]){
        await comment.write(num.toString(), 1, {provider:'test', providerId: 'test'})
    }

    for(const num of [1,2,3,4,5]){
        await comment.write(num.toString(), 1, {provider:'test', providerId: 'test'}, 5)
    }

    for(const num of [1,2,3,4,5]){
        await comment.write(num.toString(), 1, {provider:'test', providerId: 'test'}, 7)
    }

    for(const num of [1,2,3,4,5]){
        await comment.write(num.toString(), 1, {provider:'test', providerId: 'test'}, 8)
    }
    */
}