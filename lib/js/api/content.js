var elements = [];
            var lastElem = null;
            var last;
            window.addEventListener('load', (event) => {
                last = window.location.hash.substr(1);
                if (last === "") {
                    document.getElementById("Introduction_").style.background="rgb(194, 193, 193)";
                    last="Introduction";
                } else {
                    document.getElementById(`${last}_`).style.background="rgb(194, 193, 193)";
                }
                authorizationBash(false);
                authenticationBash(false);
                applicationWebhookBash(false);
                decisionsWebhookBash(false);
                deleteWebhookBash(false);
                checkTokenNode(false);
                applicationWebhookDetailsNode(false);
                offerBashContent(false);
                addEvent();
                calculate();
            });
            
            function addEvent() {
                var dropdown = document.getElementsByClassName("dropdown-btn");
                var i;
                for (i = 0; i < dropdown.length; i++) {
                    dropdown[i].addEventListener("click", function() {
                        this.classList.toggle("active");
                        var dropdownContent = this.nextElementSibling;
                        if (dropdownContent.style.display === "block") {
                            dropdownContent.style.display = "none";
                        } else {
                            dropdownContent.style.display = "block"; 
                        }
                    });
                }
            }

            function calculate() {
                $('#sidenav').children().each(function () {
                    const elem = this;
                    if (elem.nodeName !== "HR" && elem.nodeName !== "BR") {
                        if (elem.nodeName == "DIV") {
                            $(`#${elem.id}`).children().each(function () {
                                const elemInDiv = this;
                                const realElementId = elemInDiv.id.substring(0, elemInDiv.id.length-1);
                                const realElementOffsetTop = document.getElementById(`${realElementId}`).offsetTop;
                                elements.push({
                                    "id": realElementId,
                                    "offsetTop": realElementOffsetTop,
                                    "dropdown": false,
                                    "dropdownChild": true,
                                    "parentId": lastElem.id.substring(0, lastElem.id.length-1)
                                });
                            });
                        } else {
                            const realElementId = elem.id.substring(0, elem.id.length-1);
                            const realElementOffsetTop = document.getElementById(`${realElementId}`).offsetTop;
                            if (elem.className == "dropdown-btn") {
                                elements.push({
                                    "id": realElementId,
                                    "offsetTop": realElementOffsetTop,
                                    "dropdown": true,
                                    "dropdownChild": false
                                });
                            } else {
                                elements.push({
                                    "id": realElementId,
                                    "offsetTop": realElementOffsetTop,
                                    "dropdown": false,
                                    "dropdownChild": false
                                });
                            }
                        }
                    }
                    lastElem = elem;
                });
            }

            window.addEventListener("scroll", function(event) {
                    var currentScrollPos = window.scrollY;
                    for (var i = 0; i < elements.length; i++) {
                        const elem = elements[i];
                        const nextElem = elements[i+1];
                        if (currentScrollPos >= elem.offsetTop && currentScrollPos < nextElem.offsetTop && elem.id != last) {
                            document.getElementById(`${elem.id}_`).style.background="rgb(194, 193, 193)";
                            document.getElementById(`${last}_`).style.background="#509fd3";
                            last = elem.id;
                            if (elem.dropdown) {
                                closeAllDropdown();
                                openCurrentDropdown(elem.id, true);
                            } else {
                                if (!elem.dropdownChild) {
                                    closeAllDropdown();
                                } else {
                                    closeAllDropdown();
                                    openCurrentDropdown(elem.parentId, false);
                                }
                            }
                        }
                    }
                });

            function openCurrentDropdown(id, active) {
                var dropdown = document.getElementsByClassName("dropdown-btn");
                var i;
                for (i = 0; i < dropdown.length; i++) {
                    if (dropdown[i].id === `${id}_`) {
                        if (active) dropdown[i].classList.toggle("active");
                        var dropdownContent = dropdown[i].nextElementSibling;
                        dropdownContent.style.display = "block";
                    }
                }
            }

            function closeAllDropdown() {
                var dropdown = document.getElementsByClassName("dropdown-btn");
                var i;
                for (i = 0; i < dropdown.length; i++) {
                    dropdown[i].classList.toggle("active");
                    var dropdownContent = dropdown[i].nextElementSibling;
                    if (dropdownContent.style.display === "block") {
                        dropdownContent.style.display = "none";
                    }
                }
            }

            function authorizationBash(c) {
                const div = document.getElementById("authorizationContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X GET &#92; <br> 
                    &nbsp;&nbsp;url/token &#92;<br>
                    &nbsp;&nbsp-H <span style="color: #E5DA73">"Authorization: Basic xxx...yyy...zzz"</span>
                </pre>`;
                if (c) calculate();
            }

            function authorizationNode(c) {
                const div = document.getElementById("authorizationContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> token = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/token"</span>, { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"GET"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Basic xxx...yyy...zzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}, <br>
                        &nbsp;&nbsp;&nbsp;})<span style="color: #509fd3">.then</span>(res => res.json());<br>
                    })();
                </pre>`; 
                if (c) calculate();
            }

            function authorizationPython(c) {
                const div = document.getElementById("authorizationContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">import</span> requests<br>
                    token = requests.get(<br>
                    &nbsp;&nbsp;&nbsp;&nbsp<span style="color: #E5DA73">'url/token'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbspheaders={ <span style="color: #E5DA73">'Authorization'</span>: <span style="color: #E5DA73">'Basic xxx...yyy...zzz'</span> }<br>
                    ).json()
                </pre>`; 
                if (c) calculate();
            }

            function authenticationBash(c) {
                const div = document.getElementById("authenticationContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X TYPE &#92; <br> 
                    &nbsp;&nbsp;url/some/request &#92;<br>
                    &nbsp;&nbsp-H <span style="color: #E5DA73">"Authorization: Bearer xxxxx...yyyyy...zzzzz"</span>
                </pre>`;
                if (c) calculate();
            }

            function authenticationNode(c) {
                const div = document.getElementById("authenticationContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> token = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/some/request"</span>, { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"TYPE"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Bearer xxxxx...yyyyy...zzzzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}, <br>
                        &nbsp;&nbsp;&nbsp;}); <br>
                    })();
                </pre>`;
                if (c) calculate();
            }

            function applicationWebhookBash(c) {
                const div = document.getElementById("applicationWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X POST &#92; <br>
                    &nbsp;&nbsp;url/webhooks/applications &#92; <br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Content-Type: application/json'</span> &#92; <br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Authorization: Bearer xxxxx...yyyyy...zzzzz'</span> &#92; <br>
                    &nbsp;&nbsp;-d '{&nbsp<span style="color: #E5DA73">"url"</span>:<span style="color: #E5DA73">"https://some.url"</span>&nbsp}'
                </pre>`;
                if (c) calculate();
            }

            function applicationWebhookNode(c) {
                const div = document.getElementById("applicationWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> webhook = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/webhooks/applications"</span>, {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"POST"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Bearer xxxxx...yyyyy...zzzzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Content-Type"</span>: <span style="color: #E5DA73">"application/json"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;body: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"url"</span>: <span style="color: #E5DA73">"https://some.url"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
                        &nbsp;&nbsp;&nbsp;})<span style="color: #509fd3">.then</span>(res => res.json());<br>
                    })();
                </pre>`;
                if (c) calculate();
            }

            function applicationWebhookPython(c) {
                const div = document.getElementById("applicationWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">import</span> requests<br>
                    webhook = requests.post(<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url/webhooks/applications'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;headers={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Authorization'</span>: <span style="color: #E5DA73">'Bearer xxxxx...yyyyy...zzzzz'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Content-Type'</span>: <span style="color: #E5DA73">'application/json'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;},<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;json={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url'</span>: <span style="color: #E5DA73">'https://some.url'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;}<br>
                    ).json()
                </pre>`;
                if (c) calculate();
            }

            function decisionsWebhookBash(c) {
                const div = document.getElementById("decisionsWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X POST &#92; <br>
                    &nbsp;&nbsp;url/webhooks/decisions &#92; <br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Content-Type: application/json'</span> &#92; <br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Authorization: Bearer xxxxx...yyyyy...zzzzz'</span> &#92; <br>
                    &nbsp;&nbsp;-d '{&nbsp<span style="color: #E5DA73">"url"</span>:<span style="color: #E5DA73">"https://some.url"</span>&nbsp}'
                </pre>`;
                if (c) calculate();
            }

            function decisionsWebhookNode(c) {
                const div = document.getElementById("decisionsWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> webhook = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/webhooks/decisions"</span>, {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"POST"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Bearer xxxxx...yyyyy...zzzzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Content-Type"</span>: <span style="color: #E5DA73">"application/json"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;body: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"url"</span>: <span style="color: #E5DA73">"https://some.url"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
                        &nbsp;&nbsp;&nbsp;})<span style="color: #509fd3">.then</span>(res => res.json()); <br>
                    })();
                </pre>`; 
                if (c) calculate();
            }

            function decisionsWebhookPython(c) {
                const div = document.getElementById("decisionsWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">import</span> requests<br>
                    webhook = requests.post(<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url/webhooks/decisions'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;headers={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Authorization'</span>: <span style="color: #E5DA73">'Bearer xxxxx...yyyyy...zzzzz'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Content-Type'</span>: <span style="color: #E5DA73">'application/json'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;},<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;json={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url'</span>: <span style="color: #E5DA73">'https://some.url'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;}<br>
                    ).json()
                </pre>`;
                if (c) calculate();
            }

            function deleteWebhookBash(c) {
                const div = document.getElementById("deleteWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X DELETE &#92;<br>
                    &nbsp;&nbsp;url/webhooks/applications &#92;<br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Authorization: Bearer xxxxx...yyyyy...zzzzz'</span>;<br>
                </pre>`;
                if (c) calculate();
            }

            function deleteWebhookNode(c) {
                const div = document.getElementById("deleteWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> response = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/webhooks/applications"</span>, {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"DELETE"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Bearer xxxxx...yyyyy...zzzzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
                        &nbsp;&nbsp;&nbsp;})<span style="color: #509fd3">.then</span>(res => res.json()); <br>
                    })();
                </pre>`; 
                if (c) calculate();
            }

            function deleteWebhookPython(c) {
                const div = document.getElementById("deleteWebhookContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">import</span> requests<br>
                    response = requests.delete(<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url/webhooks/applications'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;headers={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Authorization'</span>: <span style="color: #E5DA73">'Bearer xxxxx...yyyyy...zzzzz'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;},<br>
                    ).json()
                </pre>`;
                if (c) calculate();
            }

            function checkTokenNode(c) {
                const div = document.getElementById("checkTokenContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> TOKEN = YOUR SECRET TOKEN;<br>
                    <span style="color: #509fd3">const</span> headers = HEADERS OF THE REQUEST;<br>
                    <span style="color: #509fd3">const</span> authorization = headers.authorization;<br>
                    <span style="color: #509fd3">if</span> (!authorization || authorization.indexOf(<span style="color: #E5DA73">"token "</span> === -1) {<br>
                    &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">return</span>;<br>
                    }<br>
                    <span style="color: #509fd3">const</span> token = authorization.split(<span style="color: #E5DA73">" "</span>)[1];<br>
                    <span style="color: #509fd3">if</span> (token !== TOKEN) {<br>
                    &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">return</span>;<br>
                    }<br>
                </pre>`; 
                if (c) calculate();
            }

            function checkTokenPython(c) {
                const div = document.getElementById("checkTokenContent");
                div.innerHTML = 
                `<pre>
                    headers = HEADERS OF THE REQUEST<br>
                    authorization = headers.get(<span style="color: #E5DA73">"Authorization"</span>)<br>
                    <span style="color: #509fd3">if</span> authorization <span style="color: #509fd3">is None or not</span> <span style="color: #E5DA73">"token"</span> <span style="color: #509fd3">in</span> authorization:<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #509fd3">return</span><br>
                    token = authorization.split(<span style="color: #E5DA73">" "</span>)[1]<br>
                    <span style="color: #509fd3">if</span> token != YOUR TOKEN:<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #509fd3">return</span>
                </pre>`; 
                if (c) calculate();
            }

            function applicationWebhookDetailsNode(c) {
                const div = document.getElementById("applicationWebhookDetailsContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> crypto = <span style="color: orange">require</span>(<span style="color: #E5DA73">"crypto"</span>); <br>
                    <br>
                    <span style="color: #509fd3">const</span> body = BODY OF THE REQUEST; <br>
                    <span style="color: #509fd3">const</span> key = YOUR KEY; <br>
                    <span style="color: #509fd3">const</span> iv = <span style="color: orange">Buffer</span>.from(body.iv, <span style="color: #E5DA73">"base64"</span>).toString(<span style="color: #E5DA73">"binary"</span>).substr(0, 16);<br>
                    <span style="color: #509fd3">const</span> encryptedData = <span style="color: orange">Buffer</span>.from(body.data, <span style="color: #E5DA73">"base64"</span>).toString();<br>
                    <span style="color: #509fd3">const</span> decipher = crypto.createDecipheriv(<span style="color: #E5DA73">"AES-256-CBC"</span>, key, iv);<br>
                    <span style="color: #509fd3">const</span> decrypted = decipher.update(encryptedData, <span style="color: #E5DA73">"base64"</span>, <span style="color: #E5DA73">"utf8"</span>) + decipher.final(<span style="color: #E5DA73">"utf8"</span>);<br>
                </pre>`; 
                if (c) calculate();
            }

            function applicationWebhookDetailsPython(c) {
                const div = document.getElementById("applicationWebhookDetailsContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> crypto = <span style="color: orange">require</span>(<span style="color: #E5DA73">"crypto"</span>); <br>
                    <br>
                    <span style="color: #509fd3">const</span> body = BODY OF THE REQUEST; <br>
                    <span style="color: #509fd3">const</span> key = YOUR KEY; <br>
                    <span style="color: #509fd3">const</span> iv = <span style="color: orange">Buffer</span>.from(body.iv, <span style="color: #E5DA73">"base64"</span>).toString(<span style="color: #E5DA73">"binary"</span>).substr(0, 16);<br>
                    <span style="color: #509fd3">const</span> encryptedData = <span style="color: orange">Buffer</span>.from(body.data, <span style="color: #E5DA73">"base64"</span>).toString();<br>
                    <span style="color: #509fd3">const</span> decipher = crypto.createDecipheriv(<span style="color: #E5DA73">"AES-256-CBC"</span>, key, iv);<br>
                    <span style="color: #509fd3">const</span> decrypted = decipher.update(encryptedData, <span style="color: #E5DA73">"base64"</span>, <span style="color: #E5DA73">"utf8"</span>) + decipher.final(<span style="color: #E5DA73">"utf8"</span>);<br>
                </pre>`; 
                if (c) calculate();
            }

            function offerBashContent(c) {
                const div = document.getElementById("offerContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">curl</span> -X POST &#92;<br>
                    &nbsp;&nbsp;url/offer &#92;<br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Content-Type: application/json'</span> &#92;<br>
                    &nbsp;&nbsp;-H <span style="color: #E5DA73">'Authorization: Bearer xxxxx...yyyyy...zzzzz'</span> &#92;<br>
                    &nbsp;&nbsp;-d '{<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"application_id"</span>:<span style="color: #E5DA73">"1581933624854x717991094173476900"</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"granted_amount"</span>:<span style="color: #E5DA73">"10000"</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"total_cost"</span>:<span style="color: #E5DA73">"12000"</span><br>
                    &nbsp;&nbsp;&nbsp}'
                </pre>`;
                if (c) calculate();
            }

            function offerNodeContent(c) {
                const div = document.getElementById("offerContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: #509fd3">const</span> fetch = <span style="color: orange">require</span>(<span style="color: #E5DA73">"node-fetch"</span>); <br>
                    (<span style="color: #509fd3">async</span> () => { <br>
                        &nbsp;&nbsp;&nbsp;<span style="color: #509fd3">const</span> response = <span style="color: #509fd3">await</span> fetch(<span style="color: #E5DA73">"url/offer"</span>, {<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;method: <span style="color: #E5DA73">"POST"</span>, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;headers: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Authorization"</span>: <span style="color: #E5DA73">"Bearer xxxxx...yyyyy...zzzzz"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"Content-Type"</span>: <span style="color: #E5DA73">"application/json"</span> <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}, <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;body: { <br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"application_id"</span>: <span style="color: #E5DA73">"1581933624854x717991094173476900"</span><br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"granted_amount"</span>: <span style="color: #E5DA73">"10000"</span><br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">"total_cost"</span>: <span style="color: #E5DA73">"12000"</span><br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br>
                        &nbsp;&nbsp;&nbsp;})<span style="color: #509fd3">.then</span>(res => res.json()); <br>
                    })();
                </pre>`; 
                if (c) calculate();
            }

            function offerPythonContent(c) {
                const div = document.getElementById("offerContent");
                div.innerHTML = 
                `<pre>
                    <span style="color: orange">import</span> requests<br>
                    response = requests.post(<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'url/offer'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;headers={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Authorization'</span>: <span style="color: #E5DA73">'Bearer xxxxx...yyyyy...zzzzz'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'Content-Type'</span>: <span style="color: #E5DA73">'application/json'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;},<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;json={<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'application_id'</span>: <span style="color: #E5DA73">'1581933624854x717991094173476900'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'granted_amount'</span>: <span style="color: #E5DA73">'10000'</span>,<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #E5DA73">'total_cost'</span>: <span style="color: #E5DA73">'12000'</span><br>
                    &nbsp;&nbsp;&nbsp;&nbsp;}<br>
                    ).json()
                </pre>`;
                if (c) calculate();
            }