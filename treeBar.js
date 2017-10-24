// ==UserScript==
// @name         TreeBar
// @namespace    https://github.com/zhilidali/
// @version      0.1.1
// @description  目录树导航条 - 显示文章目录大纲导航
// @author       zhilidali
// @match        http://www.jianshu.com/p/*
// @match        http*://juejin.im/post/*
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	var map = {
		jianshu: {
			tagName: '.show-content',
			style: `
				.treeBar {
					top: 60px;
					right: 0;
					border-color: #ea6f5a;
				}
				.treeBar-btn {
					padding: .2em 1em;
					border-color: #ea6f5a;
					background-color: #ea6f5a;
					color: #fff;
				}
				.treeBar > ul > li a {
					color: #ea6f5a;
				}
				.treeBar > ul > li a:hover {
					color: rgb(236, 97, 73);
				}
			`
		},
		juejin: {
			tagName: '.post-content-container',
			style: `
				.treeBar {
					top: 60px;
					right: 0;
				}
				.treeBar-btn {
					padding: .5em 1.5em;
					border-color: rgba(3, 113, 233, 1);
					background-color: rgba(3, 113, 233, 1);
					color: #fff;
				}
				.treeBar > ul > li a {
					color: rgba(20, 20, 20, .8);
				}
				.treeBar > ul > li a:hover {
					color: rgba(20, 20, 20, 1);
				}
			`
		},
		default: {
			tagName: 'body',
			style: `
				.treeBar {
					top: 10%;
					right: 1%;
					border-color: #555;
				}
				.treeBar-btn {
					padding: .3em 1.2em;
					background-color: #fff;
					color: #000;
				}
				.treeBar > ul > li a {
					color: #0366d6;
				}
			`
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
					position: fixed;
					max-width: 300px;
					max-height: 90%;
					overflow-y: auto;
					padding: 10px;
					border: 1px solid #ddd;
					background-color: rgba(255, 255, 255, .9);
				}
				.treeBar-btn {
					display: inline-block;
					border: 1px solid #333;
					border-radius: 3px;
					text-align: center;
					vertical-align: middle;
					outline: none;
					cursor: pointer;
				}
				.treeBar ul {
					padding-left: 1em;
					margin: 0;
				}
				.treeBar > ul > li a {
					line-height: 30px;
					/*overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;*/
					text-decoration: none;
					font-size: 14px;
					cursor: pointer;
				}
				.treeBar > ul > li a:hover {
					text-decoration: underline;
				}`,
		innerDom: `<div><button class="treeBar-btn">Toggle</button></div>`,
	};

	/* 匹配站点 */
	treeBar.matchSite = function() {
		var domain = location.href.match(/([\d\w]+)\.(com|cn|im)/i);
		this.site.name = (domain && domain[1]) || 'default';
		var siteInfo = map[this.site.name];
		this.site.tagName = siteInfo.tagName;
		this.style += siteInfo.style;
	};

	/* 创建DOM */
	treeBar.createDom = function() {
		var style = document.createElement('style'),
			dom = document.createElement('div');
		style.innerHTML = this.style;
		document.head.appendChild(style);
		dom.className = this.className;
		dom.innerHTML = this.innerDom + this.ul;
		document.body.appendChild(dom);
	};

	treeBar.onEvent = function() {
		document.querySelector('.treeBar-btn').onclick = function () {
			var ul = document.querySelector('.treeBar > ul');
			ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
		};
	};

	document.onreadystatechange = function () {
		if (document.readyState === "complete") {
			console.time('TreeBar');

			// 0. 匹配站点
			treeBar.matchSite();
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
			obj.id += obj.innerText;
			arr.push({
				name: obj.innerText,
				id: obj.innerText,
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
