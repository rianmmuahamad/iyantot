document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('url');
    const resolutionSection = document.getElementById('resolution-section');
    const resolutionSelect = document.getElementById('resolution');
    const messageDiv = document.getElementById('message');
    const fetchResolutionsButton = document.getElementById('fetch-resolutions');
    const downloadVideoButton = document.getElementById('download-video');
    const downloadAudioButton = document.getElementById('download-audio');
    const videoInfoDiv = document.getElementById('video-info');
    const loadingDiv = document.getElementById('loading');

    fetchResolutionsButton.addEventListener('click', async () => {
        const url = urlInput.value;
        console.log('Fetching resolutions for URL:', url);
        if (url) {
            try {
                loadingDiv.style.display = 'block';
                console.log('Sending request to /resolutions');
                const response = await fetch('/resolutions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                console.log('Received response from /resolutions');
                const resolutions = await response.json();
                console.log('Resolutions:', resolutions);
                resolutionSelect.innerHTML = resolutions.map(res => `<option value="${res}">${res}</option>`).join('');
                resolutionSection.style.display = 'block';
                messageDiv.textContent = '';

                // Fetch video info
                console.log('Fetching video info');
                const infoResponse = await fetch('/video-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const videoInfo = await infoResponse.json();
                console.log('Video info:', videoInfo);
                videoInfoDiv.innerHTML = `
                    <h2>${videoInfo.title}</h2>
                    <img src="${videoInfo.thumbnail}" alt="Thumbnail" />
                    <p>Duration: ${Math.floor(videoInfo.duration / 60)}:${videoInfo.duration % 60}</p>
                `;
            } catch (error) {
                messageDiv.textContent = 'Failed to fetch resolutions or video info. Please check the URL and try again.';
                console.error('Error fetching resolutions or video info:', error);
            } finally {
                loadingDiv.style.display = 'none';
                console.log('Finished fetching resolutions and video info');
            }
        } else {
            messageDiv.textContent = 'Please enter a YouTube video URL.';
            console.log('No URL entered');
        }
    });

    downloadVideoButton.addEventListener('click', async () => {
        const url = urlInput.value;
        const resolution = resolutionSelect.value;
        console.log('Downloading video with URL:', url, 'and resolution:', resolution);
        try {
            loadingDiv.style.display = 'block';
            console.log('Sending request to /download');
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, resolution })
            });
            console.log('Received response from /download');
            if (!response.ok) {
                throw new Error('Failed to download video');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            console.log('Created download URL for video');
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = "video.mp4";
            document.body.appendChild(a);
            a.click();
            a.remove();
            messageDiv.textContent = 'Video downloaded successfully!';
            console.log('Video downloaded successfully');
        } catch (error) {
            messageDiv.textContent = 'Failed to download video. Please try again.';
            console.error('Error downloading video:', error);
        } finally {
            loadingDiv.style.display = 'none';
            console.log('Finished downloading video');
        }
    });

    downloadAudioButton.addEventListener('click', async () => {
        const url = urlInput.value;
        console.log('Downloading audio with URL:', url);
        try {
            loadingDiv.style.display = 'block';
            console.log('Sending request to /audio');
            const response = await fetch('/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            console.log('Received response from /audio');
            if (!response.ok) {
                throw new Error('Failed to download audio');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            console.log('Created download URL for audio');
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = "audio.mp3";
            document.body.appendChild(a);
            a.click();
            a.remove();
            messageDiv.textContent = 'Audio downloaded successfully!';
            console.log('Audio downloaded successfully');
        } catch (error) {
            messageDiv.textContent = 'Failed to download audio. Please try again.';
            console.error('Error downloading audio:', error);
        } finally {
            loadingDiv.style.display = 'none';
            console.log('Finished downloading audio');
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log('Form submission prevented');
    });
});
