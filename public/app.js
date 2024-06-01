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
        if (url) {
            try {
                loadingDiv.style.display = 'block';
                const response = await fetch('/resolutions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const resolutions = await response.json();
                resolutionSelect.innerHTML = resolutions.map(res => `<option value="${res}">${res}</option>`).join('');
                resolutionSection.style.display = 'block';
                messageDiv.textContent = '';

                // Fetch video info
                const infoResponse = await fetch('/video-info', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const videoInfo = await infoResponse.json();
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
            }
        } else {
            messageDiv.textContent = 'Please enter a YouTube video URL.';
        }
    });

    downloadVideoButton.addEventListener('click', async () => {
        const url = urlInput.value;
        const resolution = resolutionSelect.value;
        try {
            loadingDiv.style.display = 'block';
            const response = await fetch('/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, resolution })
            });
            if (!response.ok) {
                throw new Error('Failed to download video');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = "video.mp4";
            document.body.appendChild(a);
            a.click();
            a.remove();
            messageDiv.textContent = 'Video downloaded successfully!';
        } catch (error) {
            messageDiv.textContent = 'Failed to download video. Please try again.';
            console.error('Error downloading video:', error);
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    downloadAudioButton.addEventListener('click', async () => {
        const url = urlInput.value;
        try {
            loadingDiv.style.display = 'block';
            const response = await fetch('/audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (!response.ok) {
                throw new Error('Failed to download audio');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = "audio.mp3";
            document.body.appendChild(a);
            a.click();
            a.remove();
            messageDiv.textContent = 'Audio downloaded successfully!';
        } catch (error) {
            messageDiv.textContent = 'Failed to download audio. Please try again.';
            console.error('Error downloading audio:', error);
        } finally {
            loadingDiv.style.display = 'none';
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
    });
});
