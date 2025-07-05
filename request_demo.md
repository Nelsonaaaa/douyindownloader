const data = null;

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
	if (this.readyState === this.DONE) {
		console.log(this.responseText);
	}
});

xhr.open('GET', 'https://tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com/api/v1/xiaohongshu/web/get_note_info_v3?share_text=53%20%E3%80%90%E4%BB%8E%E5%86%99%E6%8A%A2%E9%9E%8Bbot%E7%9A%84%E5%B0%91%E5%B9%B4%EF%BC%8C%E5%88%B0%E8%9E%8D%E8%B5%84%E5%8D%83%E4%B8%87%E2%80%A6%20-%20Lucas%20%7C%20%E5%B0%8F%E7%BA%A2%E4%B9%A6%20-%20%E4%BD%A0%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8C%87%E5%8D%97%E3%80%91%20%F0%9F%98%86%20w0ldfezW5QL4X8u%20%F0%9F%98%86%20https%3A%2F%2Fwww.xiaohongshu.com%2Fdiscovery%2Fitem%2F68672204000000001203d0bc%3Fsource%3Dwebshare%26xhsshare%3Dpc_web%26xsec_token%3DABV_Ud-sdyEUj3rpyKpZ2KbKTX30AKmvdXz5X-yAtIku4%3D%26xsec_source%3Dpc_share');
xhr.setRequestHeader('x-rapidapi-key', '3432c861c6msh5b60758163ec8d3p138733jsn7db8b1f9847d');
xhr.setRequestHeader('x-rapidapi-host', 'tiktok-douyin-xiaohongshu-weibo-instagram-api.p.rapidapi.com');
xhr.setRequestHeader('Authorization', 'Bearer 0OA4VGxrwlUlgwJTjUWblCQDhjhbqbb9sr9c/TK4qjRP0VoEOa9V2zu3CA==');

xhr.send(data);
