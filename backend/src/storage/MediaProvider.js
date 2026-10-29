class MediaProvider{async upload(){throw Error('Adapter must implement upload')}async delete(){throw Error('Adapter must implement delete')}transformUrl(url){return url}}module.exports=MediaProvider;
