const { Client, Message } = require('discord.js');
const yt = require('../../models/notify');
require('dotenv').config();
const axios = require('axios');


module.exports = {
    name: 'ready',
    once: true,
    /**
 * @param {Client} client
 * @param {Message} message
 */
    async execute(client, message) {
        checkYoutube();
        setInterval(checkYoutube, 300000)
        
        async function checkYoutube() {
        try{
            const notificationConfigs = await yt.find();
            
            for (const notifiactionConfig of notificationConfigs) {
                const url = `https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&channelId=${notifiactionConfig.YtChannel}&part=snippet,id&order=date&maxResults=1`;
    const response = await axios.get(url);
    const latestVideo = response.data.items[0];

    const videoTitle = latestVideo.snippet.title;
    const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;
        const channelName = latestVideo.snippet.channelTitle;
        const channelUrl = `https://www.youtube.com/channel/${latestVideo.snippet.channelId}`;

    

                
                
                const lastCheckedVideo = notifiactionConfig.LastCheckedVid;
                
                if(
                    !lastCheckedVideo || (latestVideo.id.videoId !== lastCheckedVideo.id && new Date(latestVideo.snippet.publishedAt) > new Date(lastCheckedVideo.pubDate))
                ) {
                    const targetGuild = client.guilds.cache.get(notifiactionConfig.Guild) || (await client.guilds.fetch(notifiactionConfig.Guild));
                    
                    if(!targetGuild) {
                        await notifiactionConfig.findOneAndDelete({ _id: notifiactionConfig._id });
                        continue;
                    }
                    
                    const targetChannel = targetGuild.channels.cache.get(notifiactionConfig.Channel) || (await targetGuild.channels.fetch(notifiactionConfig.Channel));
                    
                    if(!targetChannel) {
                        await notifiactionConfig.findOneAndDelete({ _id: notifiactionConfig._id });
                        continue;
                    }
                    
                    notifiactionConfig.LastCheckedVid = {
                        id: latestVideo.id.videoId,
                        pubDate: latestVideo.snippet.publishedAt,
                    };
                    
                    notifiactionConfig.save().then(() => {
                        const targetMessage = notifiactionConfig.CustomMessage
                        ?.replace("{VIDEO_URL}", videoUrl)
                        ?.replace("{VIDEO_TITLE}", videoTitle)
                        ?.replace("{CHANNEL_URL}", channelUrl)
                        ?.replace("{CHANNEL_NAME}", channelName) ||
                        `New upload by ${channelName}\n${videoUrl}`;
                        
                        targetChannel.send({content: targetMessage});
                    }).catch((e) => null);
                }
            }
        
        }catch(e){console.log(e)}
        }
    }
}
