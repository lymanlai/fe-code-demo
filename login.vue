<template>
  <view class="login-wrap">
    <!-- #ifdef MP-WEIXIN -->
    <button
      class="wx-auth-btn"
      type="primary"
      open-type="getUserInfo"
      @getuserinfo="doSocialLogin('mpWeixin')"
    >
      微信授权登录
    </button>
    <!-- #endif -->

    <!-- #ifdef APP-PLUS -->
    <view class="ifs-form">
      <view class="title">手机号登录</view>
      <view class="row">
        <input
          type="number"
          maxlength="11"
          v-model="form.mobile"
          placeholder="请输入手机号"
        />
      </view>
      <view class="row has-code">
        <input
          type="number"
          v-model="form.code"
          maxlength="4"
          placeholder="请输入短信验证码"
        />
        <view @tap="getVerifyCode">
          <count-down-btn class="send-code-wrap">
            获取验证码
          </count-down-btn>
        </view>
      </view>
      <view class="loign-btn" @tap="doSmsLogin">登录</view>
    </view>
    <view v-if="isWXInstalled">
      <view class="other-title">其它社交账号登录</view>
      <view class="icon-row-wrap">
        <image
          class="login-icon"
          @click="doSocialLogin('appWeixin')"
          src="/static/images/weixin.png"
        ></image>
        <image
          class="login-icon"
          @click="doSocialLogin('appWeibo')"
          src="/static/images/weibo.png"
        ></image>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
  const ifs = require("@/ifs");
  // #ifdef MP-WEIXIN
  // import gio from '@/ifs/growing-io'
  // #endif
  import { storeDeviceToken } from "@/ifs/app-plus-utils";
  import Config from "@/ifs/Config";
  import Utils from "@/ifs/Utils";
  import Request from "@/ifs/Request";
  // ifs.enableLog('login')
  const log = ifs.sectionLog("login");
  import { isWXInstalled } from "@/ifs/app-plus-utils";
  import countDownBtn from "@/components/count-down-btn/count-down-btn.vue";
  export default {
    components: {
      countDownBtn
    },
    data() {
      return {
        isWXInstalled: false,
        isLoading: false, // 避免用户持续重复点击登录按钮
        countDown: 60,
        form: {
          mobile: "",
          code: ""
        }
      };
    },
    computed: {
      ...ifs.mapState(["token"]),
      ...ifs.mapState("countDownBtn", ["verifyCodePending"])
    },
    async onLoad() {
      this.isWXInstalled = isWXInstalled();
      if (this.token) {
        this.$gobackOrHome();
      }
    },
    onUnload() {
      // this.update({
      //   isDoLogin: false,
      // })
    },
    methods: {
      ...ifs.mapMutations(["update"]),
      ...ifs.mapActions(["initUserData"]),
      ...ifs.mapActions("countDownBtn", ["countDownStart", "countDownReset"]),
      async doSocialLogin(type) {
        const shouldJumpToBuyer = ifs.Config.get("shouldJumpToBuyer");
        // 防止用户连续点击登录按钮
        if (this.isLoading) {
          return false;
        }
        if (!Object.keys(ifs.LoginProvider).includes(type)) {
          uni.showModal({
            content: `登录类型 ${type} 不可用`
          });
          return false;
        }
        this.isLoading = true;
        uni.showLoading();
        const data = await ifs.LoginProvider[type].login(this.form);
        this.isLoading = false;
        uni.hideLoading();
        if (data.error) {
          return;
        }
        await this.update(data);
        const user = await this.initUserData();
        await this.initTracing(user);
        uni.setStorageSync("socialLoginFrom", type);
        await uni.showToast({
          title: "登录成功"
        });
        this.$gobackOrHome();
      },
      async getVerifyCode() {
        if (this.verifyCodePending) {
          return;
        }
        if (this.form.mobile.length != 11) {
          uni.showToast({
            title: "请输入 11 位手机号",
            icon: "none"
          });
          return;
        }
        const data = {
          mobile: this.form.mobile
        };
        this.countDownStart();
        this.$loading("发送中...");
        let url = "/ifs/public/login/mobile/sendVerifyCode";
        const rz = await Request({
          method: "POST",
          prefix: "ifsApi",
          url,
          data
        });
        this.$loading(false);
        if (rz.error) {
          this.countDownReset();
          this.$error(rz.message);
          return;
        }
        this.$toast(rz.message);
      },
      async doSmsLogin() {
        if (this.form.mobile.length != 11) {
          uni.showToast({
            title: "请输入 11 位手机号",
            icon: "none"
          });
          return;
        }
        if (!this.form.code) {
          uni.showToast({
            icon: "none",
            title: "验证码不能为空"
          });
          return;
        }
        const data = this.form;
        if (this.refCode) {
          data["refCode"] = this.refCode;
        }
        uni.showLoading({
          title: "加载中..."
        });
        let url = "/ifs/public/login/mobile/smsLogin";
        const rz = await Request({
          method: "POST",
          prefix: "ifsApi",
          url,
          data
        });
        uni.hideLoading();
        if (rz.error) {
          return this.$error(rz.message);
        }
        await this.update(rz);
        const user = await this.initUserData();
        await this.initTracing(user);
        await uni.showToast({
          title: "登录成功"
        });
        this.$gobackOrHome(1000);
      },
      async initTracing(user) {
        if (!user) {
          return false;
        }
        await storeDeviceToken(true);
      }
    }
  };
</script>
