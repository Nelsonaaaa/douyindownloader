const data = null;

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xhr.open('GET', 'https://douyin-media-downloader.p.rapidapi.com/v2.php?url=https%3A%2F%2Fwww.douyin.com%2Fvideo%2F7375111957550091556');
xhr.setRequestHeader('x-rapidapi-key', '3432c861c6msh5b60758163ec8d3p138733jsn7db8b1f9847d');
xhr.setRequestHeader('x-rapidapi-host', 'douyin-media-downloader.p.rapidapi.com');

xhr.send(data);
