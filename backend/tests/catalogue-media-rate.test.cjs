const {test,after}=require('node:test');
const {db,app,request}=require('./fixture.cjs');
after(async()=>db.pool.end());
test('catalogue image requests do not exhaust the API rate-limit allowance',async()=>{
 for(let n=0;n<301;n++)await request(app).get('/uploads/selected-category/photo-coming-soon.webp').expect(200);
 await request(app).get('/api/health').expect(200);
});
