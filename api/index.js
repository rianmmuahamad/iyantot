const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public'))); 
app.use(express.json());

app.post('/resolutions', async (req, res) => {
    const { url } = req.body;
    try {
        const info = await ytdl.getInfo(url);
        const formats = ytdl.filterFormats(info.formats, 'video');
        const resolutions = Array.from(new Set(formats.map(format => format.qualityLabel))).sort();
        res.json(resolutions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch resolutions', details: error.message });
    }
});

app.post('/video-info', async (req, res) => {
    const { url } = req.body;
    try {
        const info = await ytdl.getInfo(url);
        const videoDetails = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url,
            duration: info.videoDetails.lengthSeconds,
        };
        res.json(videoDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
    }
});

app.post('/download', async (req, res) => {
    const { url, resolution } = req.body;
    const videoPath = path.join(__dirname, 'temp', `${Date.now()}_video.mp4`);
    const audioPath = path.join(__dirname, 'temp', `${Date.now()}_audio.mp4`);
    const outputPath = path.join(__dirname, 'temp', `${Date.now()}.mp4`);

    try {
        const info = await ytdl.getInfo(url);
        const videoFormat = ytdl.filterFormats(info.formats, 'video').find(f => f.qualityLabel === resolution);
        const audioFormat = ytdl.filterFormats(info.formats, 'audio').find(f => f.audioQuality);

        if (!videoFormat) {
            throw new Error(`Resolution ${resolution} not found`);
        }

        // Download video and audio separately
        const videoStream = ytdl(url, { format: videoFormat });
        const audioStream = ytdl(url, { format: audioFormat });

        const downloadVideo = new Promise((resolve, reject) => {
            const videoWriteStream = fs.createWriteStream(videoPath);
            videoStream.pipe(videoWriteStream);
            videoWriteStream.on('finish', resolve);
            videoWriteStream.on('error', reject);
        });

        const downloadAudio = new Promise((resolve, reject) => {
            const audioWriteStream = fs.createWriteStream(audioPath);
            audioStream.pipe(audioWriteStream);
            audioWriteStream.on('finish', resolve);
            audioWriteStream.on('error', reject);
        });

        await Promise.all([downloadVideo, downloadAudio]);

        // Merge video and audio using ffmpeg
        const ffmpegProcess = spawn('ffmpeg', [
            '-i', videoPath,
            '-i', audioPath,
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-strict', 'experimental',
            outputPath
        ]);

        ffmpegProcess.on('error', (error) => {
            console.error('FFmpeg error:', error);
            res.status(500).json({ message: 'Failed to process video', error: error.message });
        });

        ffmpegProcess.on('exit', (code, signal) => {
            if (code === 0) {
                res.download(outputPath, "video.mp4", (err) => {
                    if (err) {
                        console.error('Download error:', err);
                        res.status(500).json({ message: 'Failed to download video', error: err.message });
                    } else {
                        // Clean up temporary files
                        fs.unlinkSync(videoPath);
                        fs.unlinkSync(audioPath);
                        fs.unlinkSync(outputPath);
                    }
                });
            } else {
                res.status(500).json({ message: 'Failed to process video', error: `FFmpeg exited with code ${code}` });
            }
        });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
});

app.post('/audio', async (req, res) => {
    const { url } = req.body;
    try {
        const audioInfo = await ytdl.getInfo(url);
        const audioFormat = ytdl.filterFormats(audioInfo.formats, 'audioonly').find(f => f.audioQuality === 'AUDIO_QUALITY_MEDIUM');
        if (!audioFormat) {
            throw new Error('Audio format not found');
        }
        const audioStream = ytdl(url, { format: audioFormat });
        res.setHeader('Content-Disposition', `attachment; filename="audio.mp3"`);
        audioStream.pipe(res);
    } catch (error) {
        console.error('Error downloading audio:', error);
        res.status(500).json({ error: 'Failed to download audio', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
