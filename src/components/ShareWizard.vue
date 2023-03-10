<template>
  <q-dialog v-model="status" @hide="closeHandler" :maximized="$q.platform.is.mobile">
    <div :style="{width: $q.platform.is.mobile ? '100%' : '50vw'}">
      <q-toolbar class="text-white" :class="[`bg-${$theme}-9`]">
        <q-toolbar-title>Share wizard</q-toolbar-title>
      </q-toolbar>
      <div :style="{ height: $q.platform.is.mobile ? 'calc(100% - 100px)' : '50vh'}" class="scroll" :class="[`bg-${$theme}-1`]">
        <q-stepper :class="[`bg-${$theme}-1`]" flat ref="stepper" v-model="currentStep" animated class="share-stepper" done-color="green-6" active-color="amber-9" :header-class="stepsEnum.length === 1 ? 'hidden' : ''" contracted>
          <q-step name="tokens" title="Tokens" icon="mdi-fingerprint" :done="currentStep === 'replace' || currentStep === 'link'">
            <div class="text-grey-8">Tokens</div>
            <q-list separator bordered class="q-mb-md">
              <q-item
                v-for="(token, index) in currentConfig.tokens" :key="token.credentions.username"
                @click="setToken(token), currentSelectedToken = index, validateToken(token)" :active="token.label === shareBoardModel.token.label"
                clickable :active-class="`bg-${$theme}-2`"
              >
                <q-item-section>
                  <q-item-label class="text-grey-9 text-weight-bold">{{token.label}}</q-item-label>
                  <q-item-label style="font-size: .8rem" class="text-grey-8 ellipsis">{{token.credentions.username}}</q-item-label>
                </q-item-section>
                <q-item-section side v-if="token.accessable !== undefined">
                  <div v-if="token.accessable">
                    <span class="text-white bg-green-8 rounded-borders text-weight-bold q-px-sm" style="font-size:.8rem;">valid</span>
                    <q-tooltip>Validation pass</q-tooltip>
                  </div>
                  <div v-else>
                    <span class="text-white bg-red-8 rounded-borders text-weight-bold q-px-xs" style="font-size: .8rem;">invalid</span>
                    <q-tooltip>You can`t share by this token</q-tooltip>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
            <div class="col-12 q-mb-md row">
              <hr class="q-separator q-separator--horizontal col-5" style="height: 1px; margin-top: 10px;"/>
              <div class="col-2 text-grey-8 text-center text-uppercase">or</div>
              <hr class="q-separator q-separator--horizontal col-5" style="height: 1px; margin-top: 10px;"/>
            </div>
            <div class="text-grey-8">Create new token</div>
            <q-item class="q-px-none q-pb-none">
              <q-item-section>
                <q-input v-model="newTokenLabel" label="Label" color="grey-9" outlined hide-bottom-space dense class="q-mb-xs"/>
                <q-input v-model="newTokenValue" @input="newTokenError = false" label="Token" color="grey-9" outlined hide-bottom-space dense :error="!newTokenValid || newTokenError"/>
              </q-item-section>
              <q-item-section side>
                <q-btn label="add" @click="addToken" :loading="addingNewToken" flat class="full-height" :disable="!newTokenValid || newTokenError || !newTokenValue"/>
              </q-item-section>
            </q-item>
            <div v-if="newTokenError" class="text-red" style="font-size: .7rem">You need to have a Standard or ACL token for sharing set up in the MQTT Client settings. Please read more <a href="https://flespi.com/blog/mqtt-tiles-shareable-and-flexible-iot-dashboards" target="_blank">here</a>.</div>
            <div v-if="!newTokenValid" class="text-red" style="font-size: .7rem">Your token must be unique in list.</div>
          </q-step>
          <q-step name="replace" title="Upload" v-if="currentConfig.hasRemote" icon="mdi-file-replace-outline" :done="currentStep === 'link'">
            <div class="q-mx-sm q-my-md text-grey-8 text-center" style="font-size: 1.2rem;">Such board exists. Continue?</div>
            <q-checkbox v-model="isNeedCopy" color="grey-9" label="Rename to save a copy"/>
            <q-input
              color="grey-9"
              outlined hide-bottom-space dense
              v-model="shareBoardModel.boardId"
              :disable="!isNeedCopy"
              label="Name"
              :error="isNeedCopy && (shareBoardModel.boardId === currentConfig.boardId || ((currentConfig.currentRemoteBoards && currentConfig.currentRemoteBoards.includes(shareBoardModel.boardId) || !currentConfig.currentRemoteBoards)))"
            />
          </q-step>
          <q-step name="link" title="Link" :active-icon="isLinkCopied && currentStep === 'link' ? 'mdi-check' : undefined" :active-color="isLinkCopied && currentStep === 'link' ? 'green' : undefined" icon="mdi-link" :done="isLinkCopied && currentStep === 'link'">
            <template v-if="updatedBoardFlag">
              <q-input type="textarea" v-model="link" readonly outlined dense hide-bottom-space input-style="resize: none;"/>
              <div class="text-center q-mt-md">
                <q-btn @click="copyLink" flat icon="mdi-content-copy" size="1.2rem">Copy</q-btn>
              </div>
            </template>
            <template v-else-if="updatedBoardFlag === false">
              <div class="rounded-borders bg-red-1 q-pa-md">
                <div class="text-h6 text-red-8 q-mb-sm">
                  <q-icon name="mdi-alert-outline"/>
                  Share error
                </div>
                <div class="text-grey-8">Link can`t be generated without updating the board in connection. (<span class="text-grey-7">{{updateBoardError.message}}</span>)</div>
              </div>
            </template>
            <template v-else-if="updatedBoardFlag === undefined">
              <div>
                Generating...
              </div>
            </template>
          </q-step>
        </q-stepper>
      </div>
      <q-toolbar class="text-white" :class="[`bg-${$theme}-9`]">
        <q-btn flat dense class="q-mr-sm absolute" @click="closeHandler">Close</q-btn>
        <q-toolbar-title></q-toolbar-title>
        <q-btn flat v-if="canBack" @click="prevStepHandler">Back</q-btn>
        <q-btn flat class="q-ml-sm" v-if="!updateBoardError" @click="nextStepHandler" :disable="!isValidStep">{{ currentStep === 'link' ? 'Done' : 'Next' }}</q-btn>
      </q-toolbar>
    </div>
  </q-dialog>
</template>

<script>
import { Base64 } from 'js-base64'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import { copyToClipboard } from 'quasar'

export default {
  name: 'ShareWizard',
  props: ['value', 'config'],
  /*
    config = { tokens: Array, hasRemote: Boolean, boardId: String, syncNamespace: String, host: String, isRemote: Boolean, currentRemoteBoards: Array }
  */
  data () {
    return {
      stepsConst: {
        STEP_TOKEN: 'tokens',
        STEP_REPLACE: 'replace',
        STEP_LINK: 'link'
      },
      currentStep: 0,
      shareBoardModel: {
        token: '',
        boardId: this.config.boardId,
        isRemote: this.config.isRemote
      },
      link: '',
      isNeedCopy: false,
      isLinkCopied: false,
      currentConfig: cloneDeep(this.config),
      steps: [],
      updatedBoardFlag: undefined,
      updateBoardError: undefined,
      region: null,
      newTokenLabel: '',
      newTokenValue: '',
      addingNewToken: false,
      newTokenError: false
    }
  },
  computed: {
    status: {
      get () { return this.value },
      set (val) { this.$emit('input', val) }
    },
    isValidStep () {
      switch (this.currentStep) {
        case 'tokens': {
          return this.shareBoardModel.token && this.shareBoardModel.token.accessable
        }
        case 'replace': {
          return !this.isNeedCopy ||
            (
              this.isNeedCopy &&
              this.shareBoardModel.boardId !== this.currentConfig.boardId &&
              this.currentConfig.currentRemoteBoards &&
              !this.currentConfig.currentRemoteBoards.includes(this.shareBoardModel.boardId)
            )
        }
        default: { return true }
      }
    },
    stepsEnum () { return Object.values(this.steps) },
    canBack () {
      return !!this.stepsEnum.length && this.currentStep !== this.steps[0].value && !this.updateBoardError
    },
    newTokenValid () {
      return this.currentConfig.tokens.reduce((res, token) => {
        if (token.credentions.username === this.newTokenValue) {
          res = false
        }
        return res
      }, true)
    }
  },
  created () {
    const steps = {}
    let stepIndex = 0
    this.getRegionByHost(this.currentConfig.host)
      .then(() => {
        steps[stepIndex] = { label: 'Token', value: this.stepsConst.STEP_TOKEN }
        this.currentStep = this.stepsConst.STEP_TOKEN
        stepIndex++
        if (this.currentConfig.hasRemote) {
          steps[stepIndex] = { label: 'Replace', value: this.stepsConst.STEP_REPLACE }
          if (!this.currentStep) { this.currentStep = this.stepsConst.STEP_REPLACE }
          stepIndex++
        } else {
          this.setboardId(this.currentConfig.boardId, this.currentConfig.boardId)
        }
        steps[stepIndex] = { label: 'Link', value: this.stepsConst.STEP_LINK }
        if (!this.currentStep) { this.currentStep = this.stepsConst.STEP_LINK }
        this.steps = steps
      })
  },
  methods: {
    getRegionByHost (host) {
      return fetch('https://flespi.io/auth/regions', {
        mode: 'cors'
      }).then(response => response.json())
        .then((data) => {
          this.region = data.result.reduce((region, cregion) => {
            if (`wss://${cregion['mqtt-ws']}`.indexOf(host) === 0) {
              region = cregion
            }
            return region
          }, null)
        })
    },
    closeHandler () {
      this.link = ''
      this.shareBoardModel = {}
      this.currentStep = this.stepsConst.STEP_TOKEN
      this.steps = []
      this.updatedBoardFlag = undefined
      this.updateBoardError = undefined
      this.$emit('input', false)
      this.$emit('hide')
    },
    nextStepHandler () {
      this.validateCurrentStep()
        .then((result) => {
          if (result) {
            this.$refs.stepper.next()
          }
        })
    },
    prevStepHandler () {
      if (this.isLinkCopied) { this.isLinkCopied = false }
      this.$refs.stepper.previous()
    },
    validateCurrentStep () {
      switch (this.currentStep) {
        case 'tokens': {
          const isTokenValid = this.validateToken(this.shareBoardModel.token)
          if (isTokenValid && this.shareBoardModel.boardId) {
            this.generateLink()
          }
          return isTokenValid
        }
        case 'replace': {
          return this.setboardId(this.shareBoardModel.boardId, this.currentConfig.boardId)
        }
        case 'link': {
          return Promise.resolve(this.closeHandler())
        }
      }
    },
    validateToken (token) {
      /*
        getAuthInfo then setToken
      */
      const flespiToken = token.credentions.username.indexOf('FlespiToken ') === 0
        ? token.credentions.username
        : `FlespiToken ${token.credentions.username}`
      return fetch(`${this.region.rest}/auth/info`, {
        mode: 'cors',
        headers: {
          Authorization: flespiToken
        }
      }).then(response => response.json())
        .then((accessData) => {
          const access = get(accessData, 'result[0].access.type', 1)
          const errors = !!accessData.errors
          const accessGranted = access !== 1
          if (accessGranted) {
            this.setToken(token)
            this.$set(token, 'accessable', true)
          } else if (errors || !accessGranted) {
            this.$set(token, 'accessable', false)
          }
          return !(errors || !accessGranted)
        })
    },
    setToken (token) {
      this.$set(this.shareBoardModel, 'token', token)
    },
    setboardId (boardId, oldBoardId) {
      this.$set(this.shareBoardModel, 'boardId', boardId)
      let resp = Promise.resolve(true)
      if (!this.currentConfig.isRemote) {
        resp = this.currentConfig.updateBoardMethod(oldBoardId, boardId)
          .then((resp) => {
            if (resp instanceof Error) {
              this.updatedBoardFlag = false
              this.updateBoardError = resp
              return true
            }
            this.updatedBoardFlag = true
            this.$emit('share', this.shareBoardModel)
            this.generateLink()
            return true
          })
      } else {
        this.updatedBoardFlag = true
        this.$emit('share', this.shareBoardModel)
        this.generateLink()
      }
      return resp
    },
    generateLink () {
      const token = get(this.shareBoardModel, 'token.credentions.username', '')
      if (!token) { return }
      const topic = this.currentConfig.syncNamespace,
        host = this.currentConfig.host,
        shareObj = { token, topic, boardId: this.shareBoardModel.boardId }
      if (host.indexOf('wss://mqtt.flespi.io') !== 0) {
        shareObj.host = host
      }
      const link = `${window.location.origin}${window.location.pathname}#/${Base64.encode(JSON.stringify(shareObj))}`
      this.link = link
    },
    copyLink () {
      copyToClipboard(this.link)
        .then((e) => {
          this.$q.notify({
            color: 'positive',
            icon: 'content_copy',
            message: 'Link copied',
            timeout: 1000,
            position: 'bottom-left'
          })
          this.isLinkCopied = true
        }, (e) => {
          this.$q.notify({
            color: 'negative',
            icon: 'content_copy',
            message: 'Error coping link',
            timeout: 1000,
            position: 'bottom-left'
          })
        })
    },
    addToken () {
      const token = {
        credentions: {
          username: this.newTokenValue
        },
        label: this.newTokenLabel
      }
      this.addingNewToken = true
      this.validateToken(token)
        .then((granted) => {
          if (granted) {
            this.currentConfig.tokens.push(token)
            this.$root.$emit('new-share-token', token)
            this.newTokenValue = ''
            this.newTokenLabel = ''
          } else {
            this.newTokenError = true
          }
          this.addingNewToken = false
        })
    }
  }
}
</script>

<style lang="stylus">
  .share-stepper
    overflow hidden
    height 100%
    .q-stepper__content
      height calc(100% - 72px)
</style>
