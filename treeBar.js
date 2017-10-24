// ==UserScript==
// @name         treeBar - 前端博客目录大纲导航
// @namespace    https://github.com/zhilidali/
// @version      0.1
// @description  显示文章目录导航
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
				.zhilidali {
					top: 60px;
					right: 0;
					border-color: #ea6f5a;
				}
				.zhilidali-btn {
					border-color: #ea6f5a;
					background-color: #ea6f5a;
					color: #fff;
				}
				.zhilidali > ul > li a {
					color: #ea6f5a;
				}
				.zhilidali > ul > li a:hover {
					color: rgb(236, 97, 73);
				}
			`
		},
		juejin: {
			tagName: '.post-content-container',
			style: `
				.zhilidali {
					top: 60px;
					right: 0;
				}
				.zhilidali-btn {
					border-color: rgba(3, 113, 233, 1);
					background-color: rgba(3, 113, 233, 1);
					color: #fff;
				}
				.zhilidali > ul > li a {
					color: rgba(20, 20, 20, .8);
				}
				.zhilidali > ul > li a:hover {
					color: rgba(20, 20, 20, 1);
				}
			`
		},
		default: {
			tagName: 'body',
			style: `
				.zhilidali {
					top: 10%;
					right: 1%;
					border-color: #555;
				}
				.zhilidali-btn {
					background-color: #fff;
					color: #000;
				}
				.zhilidali > ul > li a {
					color: #0366d6;
				}
			`
		}
	};
	window.zhilidali = {
		site: {
			name: '',
			tagName: '',
		},
		className: `zhilidali`,
		style: `
				.zhilidali {
					position: fixed;
					max-width: 300px;
					max-height: 90%;
					overflow-y: auto;
					padding: 10px;
					border: 1px solid #ddd;
					background-color: rgba(255, 255, 255, .9);
				}
				.zhilidali-btn {
					display: inline-block;
					padding: .3em 1.2em;
					border: 1px solid #333;
					border-radius: 3px;
					text-align: center;
					vertical-align: middle;
					outline: none;
					cursor: pointer;
				}
				.zhilidali ul {
					padding-left: 1em;
					margin: 0;
				}
				.zhilidali > ul > li a {
					line-height: 30px;
					/*overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;*/
					text-decoration: none;
					font-size: 14px;
					cursor: pointer;
				}
				.zhilidali > ul > li a:hover {
					text-decoration: underline;
				}`,
		innerDom: `<div><button class="zhilidali-btn">Toggle</button></div>`
	};

	window.onload = function() {
		// 0. 匹配站点
		matchSite();
		// 1. 获取DOM
		var wrap = document.querySelector(zhilidali.site.tagName),
			hList = wrap.querySelectorAll('h1, h2, h3, h4, h5, h6');
		// 2. 构建数据
		var tree = transformTree(Array.from(hList));
		// 3. 构建DOM
		createDom(zhilidali, tree);
		// 4. 定义事件
		document.querySelector('.zhilidali-btn').onclick = function () {
			var ul = document.querySelector('.zhilidali > ul');
			ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
		};
		console.log('zhilidali');
	};

	/* 匹配站点 */
	function matchSite() {
		var domain = location.href.match(/([\d\w]+)\.(com|cn|im)/i);
		zhilidali.site.name = (domain && domain[1]) || 'default';
		var siteInfo = map[zhilidali.site.name];
		zhilidali.site.tagName = siteInfo.tagName;
		zhilidali.style += siteInfo.style;
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
				id: obj.innerText,
				tagName: obj.tagName
			});
		}

		return result;
	}

	/* 创建DOM */
	function createDom(zhilidali, tree) {
		var style = document.createElement('style'),
			dom = document.createElement('div');
		style.innerHTML = zhilidali.style;
		document.head.appendChild(style);
		dom.className = zhilidali.className;
		dom.innerHTML = zhilidali.innerDom + compileList(tree);
		document.body.appendChild(dom);
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
