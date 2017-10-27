// ==UserScript==
// @name         TreeBar
// @name:zh-CN   目录树导航
// @namespace    https://github.com/zhilidali/TreeBar/
// @version      0.1.2
// @description  目录树导航 - 显示文章目录大纲导航
// @description:zh-cn    目录树导航 - 显示文章目录大纲导航
// @author       zhilidali
// @mail         zhilidali@qq.com
// @license      MIT Licensed
// @match        http://www.jianshu.com/p/*
// @match        http*://juejin.im/post/*
// @match        http*://sspai.com/*
// @match        http*://zhuanlan.zhihu.com/p/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	var map = {
		jianshu: {
			tagName: '.show-content',
			sync: true,
			style: {
				top: '55px',
				color: '#ea6f5a',
			}
		},
		zhihu: {
			tagName: '.PostIndex-content',
			sync: true,
		},
		sspai: {
			tagName: '#article-content',
			sync: true,
		},
		juejin: {
			tagName: '.post-content-container',
		},
		default: {
			tagName: 'body'
		}
	};
	var treeBar = window.treeBar = {
		site: {
			name: '',
			tagName: '',
		},
		className: `treeBar`,
		style: `
				.treeBar {
					z-index: 99999;
					position: fixed;
					top: 10%;
					right: 0;
					max-width: 300px;
					max-height: 90%;
					overflow-y: auto;
					padding: 10px;
					border: 1px solid #ddd;
					background-color: rgba(255, 255, 255, .9);
				}
				.treeBar-resize {
					position: absolute;
					// cursor: col-resize;
					width: 5px;
					left: -2px;
					top: 0;
					bottom: 0;
				}
				.treeBar-btn {
					display: inline-block;
					width: 72px;
					height: 28px;
					padding: 0;
					box-sizing: border-box;
					border: 1px solid #ddd;
					border-radius: 3px;
					box-shadow: 0 1px 1px 1px #ddd;
					font-size: 14px;
					background-color: #fff;
					vertical-align: middle;
					text-align: center;
					outline: none;
					cursor: pointer;
					color: #333;
				}
				.treeBar ul {
					padding-left: 1em;
					margin: 0;
				}
				.treeBar > ul > li {
				    list-style-type: disc;
				}
				.treeBar > ul > li > ul > li {
				    list-style-type: circle;
				}
				.treeBar > ul > li > ul > li > ul > li {
				    list-style-type: square;
				}
				.treeBar > ul > li a {
					line-height: 30px;
					/*overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;*/
					text-decoration: none;
					font-size: 14px;
					cursor: pointer;
					color: #0371e9;
				}
				.treeBar > ul > li a:hover {
					text-decoration: underline;
				}`,
		innerDom: `<div><button class="treeBar-btn">TreeBar</button><div class="treeBar-resize"></div></div>`,
		matchSite: function() {/* 匹配站点 */
			var domain = location.href.match(/([\d\w]+)\.(com|cn|im)/i);
			this.site.name = (domain && domain[1]);
			var siteInfo = map[this.site.name] || map.default;
			this.site.tagName = siteInfo.tagName;
			this.site.sync = siteInfo.sync || false;
			if (siteInfo.style) {
				this.style += `
					.treeBar {
						top: ${siteInfo.style.top};
						border-color: ${siteInfo.style.color};
					}
					.treeBar-btn {
						border-color: ${siteInfo.style.color};
						background-color: ${siteInfo.style.color};
						color: #fff;
					}
					.treeBar > ul > li a {
						color: ${siteInfo.style.color};
					}
				`;
			}
		},
		createDom: function() {/* 创建DOM */
			var style = document.createElement('style'),
				dom = document.createElement('div');
			style.innerHTML = this.style;
			document.head.appendChild(style);
			dom.className = this.className;
			dom.innerHTML = this.innerDom + this.ul;
			document.body.appendChild(dom);
		},
		onEvent: function() {
			document.querySelector('.treeBar-btn').onclick = function () {
				var ul = document.querySelector('.treeBar > ul');
				ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
			};
			/*var resize = {};
			document.body.onmouseup = function() {
				console.log('up');
				resize.flag = false;
			};
			document.querySelector('.treeBar-resize').onmousedown = function() {
				resize.flag = true;
			};
			document.body.onmousemove = function() {
				if (!resize.flag) return;
				var tree = document.querySelector('.treeBar');
				if (resize.current === undefined) {
					resize.current = event.x;
					return;
				}
				var x = event.x - resize.current;
				if(Math.abs(x) >= 10) {
					tree.style.width = tree.offsetWidth - x + 'px';
					console.log(x);
					resize.current = event.x;
				}
			};*/
		},
		init: function() {
			console.time('TreeBar');

			// 1. 获取DOM
			var hList = document.querySelector(treeBar.site.tagName)
						.querySelectorAll('h1, h2, h3, h4, h5, h6');
			// 2. 构建数据
			var tree = transformTree(Array.from(hList));
			// 3. 构建DOM
			treeBar.ul = compileList(tree);
			treeBar.createDom();
			// 4. 注册事件
			treeBar.onEvent();

			console.timeEnd('TreeBar');
		}
	};

	// 0. 匹配站点
	treeBar.matchSite();
	if (treeBar.site.sync) {
		treeBar.init();
	} else {
		document.onreadystatechange = function () {
			document.readyState === "complete" && treeBar.init();
		};
	}


	/* 解析DOM，构建树形数据 */
	function transformTree(list) {
		var result = [];
		list.reduce(function (res, cur, index, arr) {
			var prev = res[res.length - 1];
			if (compare(prev, cur)) {
				if (!prev.sub) prev.sub = [];
				prev.sub.push(cur);
				if (index === arr.length - 1) prev.sub = transformTree(prev.sub);
			} else {
				construct(res, cur);
				if (prev && prev.sub) prev.sub = transformTree(prev.sub);
			}
			return res;
		}, result);

		// 转为树形结构的条件依据
		function compare(prev, cur) {
			return prev && cur.tagName.replace(/h/i, '') > prev.tagName.replace(/h/i, '');
		}

		// 转为树形结构后的数据改造
		function construct(arr, obj) {
			arr.push({
				name: obj.innerText,
				id: obj.id = obj.innerText,
				tagName: obj.tagName
			});
		}

		return result;
	}

	/* 根据数据构建目录 */
	function compileList(tree) {
		var list = '';
		tree.forEach(function(item) {
			var ul = item.sub ? compileList(item.sub) : '';
			list +=
				`<li>
					<a href="#${item.id}" title="${item.name}">${item.name}</a>${ul}
				</li>`;
		});
		return `<ul>${list}</ul>`;
	}

})();
