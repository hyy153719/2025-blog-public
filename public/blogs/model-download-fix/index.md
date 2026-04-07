自从换了共享节点后，网速变慢了，昨天从c站下载模型总是超时，咨询Gemini后，它给出四个方案；
 方案1 使用命令行工具Aria2
 方案2 去找镜像网站
 方案3 使用专业下载软件
 方案4 开启代理 TUN 模式 或 全局路由

在确认hugging face没有我想下载的模型，和尝试使用专业下载工具无果后，决定使用命令行工具，在Gemini指挥下，我下载了Aria2下载器
步骤：
# 访问：https://github.com/aria2/aria2/releases 
# 下载aria2-1.37.0-win-64bit-build1.zip
# 进入该解压后的文件夹，在顶部地址栏输入 `cmd` 并回车打开终端，然后我查找了指纹浏览器当前代理的IP和端口，再去c站找api 钥匙，执行如下下载命令：
aria2c --all-proxy="socks5://<代理IP>:<代理端口>" -c -x 16 -s 16 -d . -o "akiumLumenILLBase_base.safetensors" "https://civitai.com/api/download/models/251543?token=<你的Civitai_API_Key>"

而后出现了问题![](/blogs/model-download-fix/9117097c7a83a45c.png)**第一次报错**
原来Aria2 原生只支持 http 格式的代理，不支持直接填入 socks5 格式的代理来进行 HTTP 下载。
再Gemini建议下，我使用windows另一个下载工具“curl”，完美支持socks5代理，且支持断点续传。
命令如下：
curl.exe -x socks5h://direct.miyaip.online:8001 -L -C - -o "akiumLumenILLBase_base.safetensors" "https://civitai.com/api/download/models/251543?token=c83f40d1622e050316e9655c5b5fac9b"

第二次报错是因为我的代理需要进行身份验证，这个问题很快就解决了
curl.exe -x socks5h://你的代理账号:你的代理密码@direct.miyaip.online:8001 -L -C - -o "akiumLumenILLBase_base.safetensors" "https://civitai.com/api/download/models/251543?token=c83f40d1622e050316e9655c5b5fac9b"

第三次报错信息 curl: (18) end of response with 6524274796 bytes missing 意思是：服务器或代理单方面强行切断了连接。由于在命令里加了 -C -（断点续传）参数，只需要重复执行。

第四次报错![](/blogs/model-download-fix/5da3aa3d20ae8a38.png)意思是“服务器不支持断点续传”。
原因是https://civitai.com/api/download/...。这是一个 API 中转链接。
curl 收到断点续传的指令（-C -）后，直接跑去问这个中转站能不能续传，中转站说“我只负责跳转，手里没文件，不支持续传”，于是 curl 就直接罢工了，根本没走到真正存放文件的服务器那一步。
于是我到浏览器 ctrl+j 打开下载界面，直接复制下载链接，绕过 API 验证，接着下载。
