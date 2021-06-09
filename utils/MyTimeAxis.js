; (function (window, document) {

	/**
		配置选项
		{	
			id: '#xxx',				// 必填。id
			list: [					// 必填。时间文本数组
				{date: '2019-07-26', text: 'Hello World!'}
			],
			time: 500,				// 非必填。默认500。两点过渡时间
			space: 150,				// 非必填。默认150。两点间距，为'date'时两点间距根据两点时间date间隔天数乘以dateSpace决定
			dot: 10,				// 非必填。默认10。点的尺寸
			showItems: false,		// 非必填。默认false。是否显示所有的文本，在space为'date'时最好别设为true，因为两点可能隔得很近，让文本重叠了
			dateSpace: 2,			// 非必填。默认2。在space为'date'时有用，一天间距多少px
			onSlideChange: null		// 非必填。默认null。点切换的时候调用的函数，可以通过this.activeIndex获取到当前点的下标
		}
	*/

  function MyTimeAxis (opt) {
    this.time = opt.time || 500;					// 两个点切换动画时间
    this.iSpace = opt.space || 150;					// 两个点的间隔
    this.iDot = opt.dot || 16;						// 点的尺寸
    this.showItems = opt.showItems || false;		// 是否显示所有的天
    this.dateSpace = opt.dateSpace || 2;			// 使用时间为间隔时每天的间隔px
    this.onSlideChange = opt.onSlideChange || null; // 切换时执行方法

    if (!opt.id || !(opt.list instanceof Array)) {
      return;
    }
    this.oWrap = document.getElementById(opt.id);
    this.list = opt.list;

    this.init();
  }

  var prototype = {
    init: function () {
      // 尺寸对象
      this.oSize = {
        ctW: 0,			// 线容器宽度
        ctH: 0,			// 线容器高度
        lineW: 0		// 线的宽度
      }

      this.activeIndex = 0;	// 当前点的下标
      this.resizeTimer = null;// 页面改变延时器

      this.initState();
    },

    initState: function () {
      this.setTimeAxisHtml();
      this.setDotActive(this.activeIndex, true);
    },

    initEvent: function () {
      var _this = this;

      // 向上
      this.oPrev.onclick = function () {
        if (_this.activeIndex <= 0) {
          return;
        }
        _this.setDotActive(_this.activeIndex - 1);
      }

      // 向下
      this.oNext.onclick = function () {
        if (_this.activeIndex >= _this.list.length - 1) {
          return;
        }
        _this.setDotActive(_this.activeIndex + 1);
      }

      // 点点击
      for (var i = 0; i < this.oDot.length; i++) {
        this.oDot[i].onclick = function () {
          var idx = this.getAttribute('data-index')
          if (_this.activeIndex == idx) {
            return;
          }

          _this.setDotActive(idx);
        }
      }


      // 设置页面改变事件
      this.setWindowResize();
    },

    // 设置页面改变事件
    setWindowResize: function () {
      var _this = this;

      function resize () {
        setStyle(_this.oDot, {
          opacity: 0
        })

        clearTimeout(_this.resizeTimer);
        _this.resizeTimer = setTimeout(function () {
          setStyle(_this.oDot, {
            opacity: 1
          })

          _this.initState();
        }, 500);
      }

      window.removeEventListener('resize', resize);
      window.addEventListener('resize', resize);
    },

    // 设置时间轴节点
    setTimeAxisHtml: function () {
      var _this = this;
      var html = '<div class="my-time-axis">' +
        '				<div class="time-axis-container">';

      if (!this.showItems) {
        html += '		<div class="date">' + _this.list[_this.activeIndex].date + '</div>' +
          '				<div class="text">' + _this.list[_this.activeIndex].text + '</div>';
      }

      html += '			 
      '					<div class="line">';

      if (this.showItems) {
        html += '			<div class="date-list">';
        this.list.forEach(function (item, index) {
          html += '			<div class="date">' + item.date + '</div>';
        })
        html += '			</div>' +
          '					<div class="text-list">';
        this.list.forEach(function (item, index) {
          html += '			<div class="text">' + item.text + '</div>';
        })
        html += '			</div>';
      }

      this.list.forEach(function (item, index) {
        html += '			<div class="dot" data-index="' + index + '"></div>';
      })

      html += '			</div>' +
        '				</div>' +
        '				<div class="prev-btn"></div>' +
        '				<div class="next-btn"></div>' +
        '			</div>';


      this.oWrap.innerHTML = html;

      this.getDom();
      this.getSize();
      this.setTimeAxisStyle();
      this.initEvent();
    },

    // 获取节点
    getDom: function () {
      this.oMyTimeAxis = this.oWrap.querySelector('.my-time-axis');

      this.oContainer = this.oMyTimeAxis.querySelector('.time-axis-container');
      this.oPrev = this.oMyTimeAxis.querySelector('.prev-btn');
      this.oNext = this.oMyTimeAxis.querySelector('.next-btn');
      this.oShortLine = this.oMyTimeAxis.querySelector('.short-line');
      this.oLine = this.oMyTimeAxis.querySelector('.line');
      this.oDot = this.oMyTimeAxis.querySelectorAll('.dot');

      this.oDateList = this.oMyTimeAxis.querySelector('.date-list');
      this.oDate = this.oMyTimeAxis.querySelectorAll('.date');
      this.oTextList = this.oMyTimeAxis.querySelector('.text-list');
      this.oText = this.oMyTimeAxis.querySelectorAll('.text');
    },

    // 获取尺寸
    getSize: function () {
      this.oSize.ctW = this.oContainer.offsetWidth - 80; // margin: 0 40px所以要减80
      this.oSize.ctH = this.oContainer.offsetHeight;

      this.oSize.lineW = this.getLineW();
    },

    // 获取线宽度
    getLineW: function () {
      var res = 0;

      res += this.oSize.ctW;						// 线容器宽度
      res += this.list.length * this.iDot;		// 所有点宽度

      if (this.iSpace == 'date') {
        var day1 = new Date(this.list[0].date).getTime();
        var day2 = new Date(this.list[this.list.length - 1].date).getTime();
        res += parseInt(Math.abs(day1 - day2) / (24 * 60 * 60 * 1000)) * this.dateSpace;

      } else {
        res += (this.list.length - 1) * this.iSpace;// 所有间隔宽度
      }

      res -= this.iDot;

      return res;
    },

    // 设置线点的样式
    setTimeAxisStyle: function () {
      setStyle(this.oMyTimeAxis, {
        position: 'relative',
        width: '100%',
        height: '100%'
      });

      setStyle(this.oPrev, {
        position: 'absolute',
        top: '50%',
        left: '6px',
        marginTop: '-22px',
        width: '27px',
        height: '44px',
        background: 'url(../img/prev.svg) no-repeat center',
        backgroundSize: '100% 100%',
        cursor: 'pointer',
      })

      setStyle(this.oNext, {
        position: 'absolute',
        top: '50%',
        right: '6px',
        marginTop: '-22px',
        width: '27px',
        height: '44px',
        background: 'url(../img/next.svg) no-repeat center',
        backgroundSize: '100% 100%',
        cursor: 'pointer',
      })

      setStyle(this.oContainer, {
        position: 'relative',
        margin: "0 40px",
        height: "100%",
        overflow: 'hidden'
      })

      setStyle(this.oShortLine, {
        position: 'absolute',
        top: '50%',
        left: 0,
        zIndex: 2,
        width: '50px',
        height: '0',
        borderBottom: '1px dashed #007aff',
        background: '#fff'
      })

      setStyle(this.oLine, {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        width: this.oSize.lineW + 'px',
        minWidth: '100%',
        height: '50%',
        borderBottom: '1px solid #007aff',
        transition: 'left ' + this.time + 'ms linear'
      })

      // 显示所有时间文本
      if (this.showItems) {
        setStyle(this.oDateList, {
          position: 'absolute',
          bottom: '-40px',
          left: 0,
          width: '100%',
          height: '20px'
        })

        setStyle(this.oTextList, {
          position: 'absolute',
          bottom: '20px',
          left: 0,
          width: '100%',
          height: '20px'
        })

        // 只显示一组时间文本
      } else {
        setStyle(this.oDate, {
          position: 'absolute',
          top: '50%',
          zIndex: 4,
          marginTop: '20px',
          lineHeight: '20px',
          width: '100%',
          textAlign: 'center'
        })

        setStyle(this.oText, {
          position: 'absolute',
          top: '50%',
          zIndex: 4,
          marginTop: '-40px',
          lineHeight: '20px',
          width: '100%',
          textAlign: 'center'
        })
      }

      var left = (this.oSize.ctW - this.iDot) / 2;
      var day1 = day2 = new Date(this.list[0].date).getTime();
      var iLeft = 0;

      for (var i = 0; i < this.oDot.length; i++) {
        if (this.iSpace == 'date') {
          day2 = new Date(this.list[i].date).getTime();
          iLeft = left + parseInt(Math.abs(day2 - day1) / (24 * 60 * 60 * 1000)) * this.dateSpace;
          iLeft += i * this.iDot;

        } else {
          iLeft = (this.oSize.ctW - this.iDot) / 2 + i * (this.iDot + this.iSpace);
        }


        setStyle(this.oDot[i], {
          position: 'absolute',
          bottom: -1 * this.iDot / 2 + 'px',
          left: iLeft + 'px',
          width: this.iDot + 'px',
          height: this.iDot + 'px',
          borderRadius: '50%',
          background: '#fff',
          border: '1px solid #4C5CB3',
          cursor: 'pointer',
          boxSizing: 'border-box',
          transition: 'background 200ms linear'
        })

        if (this.showItems) {
          iLeft += this.iDot / 2;
          setStyle(this.oDate[i], {
            position: 'absolute',
            top: 0,
            left: iLeft + 'px',
            lineHeight: '20px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)'
          })
          setStyle(this.oText[i], {
            position: 'absolute',
            top: 0,
            left: iLeft + 'px',
            lineHeight: '20px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transform: 'translateX(-50%)'
          })
        }
      }
    },

    // 设置点的选中
    setDotActive: function (num, isInit) {

      if (this.list.length <= 1) {
        this.setDisabled(this.oPrev, false);
        this.setDisabled(this.oNext, false);
      } else {
        if (num <= 0) {
          this.setDisabled(this.oPrev, true);
        } else {
          this.setDisabled(this.oPrev, false);
        }

        if (num >= this.list.length - 1) {
          this.setDisabled(this.oNext, true);
        } else {
          this.setDisabled(this.oNext, false);
        }
      }

      this.activeIndex = num;
      for (var i = 0; i < this.oDot.length; i++) {
        // 设置点颜色
        if (i == num) {
          setStyle(this.oDot[i], {
            background: '#fff'
          })
        } else {
          setStyle(this.oDot[i], {
            background: '#4C5CB3'
          })
        }
      }

      this.setLineLeft();
      if (!this.showItems) {
        this.setTransDate(isInit);
        this.setTransText(isInit);
      }
      if (this.onSlideChange) {
        this.onSlideChange();
      }
    },

    // 设置线的left
    setLineLeft: function () {
      var iLeft = 0;
      if (this.iSpace == 'date') {
        var day1 = new Date(this.list[0].date).getTime();
        var day2 = new Date(this.list[this.activeIndex].date).getTime();
        iLeft = -1 * (parseInt(Math.abs(day1 - day2) / (24 * 60 * 60 * 1000)) * this.dateSpace + this.activeIndex * this.iDot);

      } else {
        iLeft = -1 * this.activeIndex * (this.iDot + this.iSpace);
      }

      setStyle(this.oLine, {
        left: iLeft + 'px'
      })
    },

    // 设置时间动画
    setTransDate: function (isInit) {
      var _this = this;

      if (isInit) {
        return;
      }

      setStyle(this.oDate, {
        transition: 'all ' + this.time + 'ms linear',
        transform: 'translateY(10px)',
        opacity: 0
      })
      setTimeout(function () {
        _this.oDate[0].innerText = _this.list[_this.activeIndex].date;

        setStyle(_this.oDate, {
          transition: 'all ' + _this.time + 'ms linear',
          transform: 'translateY(0)',
          opacity: 1
        })

      }, this.time + 10);
    },

    // 设置文本动画
    setTransText: function (isInit) {
      var _this = this;

      if (isInit) {
        return;
      }

      setStyle(this.oText, {
        transition: 'all ' + this.time + 'ms linear',
        transform: 'translateY(-10px)',
        opacity: 0
      })
      setTimeout(function () {
        _this.oText[0].innerText = _this.list[_this.activeIndex].text;

        setStyle(_this.oText, {
          transition: 'all ' + _this.time + 'ms linear',
          transform: 'translateY(0)',
          opacity: 1
        })

      }, this.time + 10);
    },

    // 设置前后按钮状态
    setDisabled: function (dom, bl) {
      if (bl) {
        if (hasClass(dom, 'disabled')) {
          return;
        }
        addClass(dom, 'disabled');
        setStyle(dom, {
          cursor: 'default',
          opacity: .35
        })
      } else {
        if (!hasClass(dom, 'disabled')) {
          return;
        }
        delClass(dom, 'disabled');
        setStyle(dom, {
          cursor: 'pointer',
          opacity: 1
        })
      }
    },
  }
  for (var i in prototype) {
    MyTimeAxis.prototype[i] = prototype[i];
  }


  function getStyle (obj, name) {
    if (window.getComputedStyle) {
      return getComputedStyle(obj, null)[name];
    } else {
      return obj.currentStyle[name];
    }
  }
  function setStyle (obj, oStyle) {

    if (obj.length == undefined) {
      for (var i in oStyle) {
        obj.style[i] = oStyle[i];
      }
    } else {
      for (var i = 0; i < obj.length; i++) {
        for (var key in oStyle) {
          obj[i].style[key] = oStyle[key];
        }
      }
    }
  }
  // 获取class节点
  function getByClass (className) {
    var arr = [];
    if (document.querySelectorAll) {
      var aElm = document.querySelectorAll('.' + className);
      for (var i = 0; i < arr.length; i++) {
        arr.push(aElm[i]);
      }
    } else {
      var aElm = doc.getElementsByTagName("*");

      for (var i = 0; i < aElm.length; i++) {
        if (hasClass(aElm[i], className)) {
          arr.push(aElm[i]);
        }
      }
    }
    return arr;
  }

  // 获取节点的class列表
  function getClassList (obj) {
    var sClass = obj.className;
    var aClass = sClass.split(' ');
    var list = [];
    aClass.forEach(function (item, index) {
      if (item) {
        list.push(item);
      }
    })
    return list;
  }

  // 判断是否存在class
  function hasClass (obj, name) {
    var sClass = obj.className;
    var reg = new RegExp('\\b' + name + '\\b');
    if (reg.test(sClass)) {
      return true;
    }
    return false;
  }

  // 添加样式名
  function addClass (obj, name) {
    var hasName = hasClass(obj, name);

    if (!hasName) {
      var aClass = getClassList(obj);
      var sClass = '';
      aClass.push(name);

      aClass.forEach(function (item, index, arr) {
        sClass += item;
        if (index < arr.length - 1) {
          sClass += ' ';
        }
      })

      obj.className = sClass;
    }
  }

  // 删除样式名
  function delClass (obj, name) {
    var hasName = hasClass(obj, name);

    if (hasName) {
      var sClass = obj.className;
      var arr = sClass.split(name);
      sClass = '';
      arr.forEach(function (item) {
        sClass += item;
      })
      sClass = sClass.replace(/\s+/g, ' ');
      sClass = sClass.replace(/^\s|\s$/g, '');
      obj.className = sClass;
    }
  }

  window.MyTimeAxis = MyTimeAxis;
})(window, document);