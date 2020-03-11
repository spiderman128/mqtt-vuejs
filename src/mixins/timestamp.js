import get from 'lodash/get'
import { date } from 'quasar'
export default {
  computed: {
    time () {
      return Object.keys(this.value).reduce((timestamp, topic) => {
        if (!this.value[topic]) { return timestamp }
        const time = parseInt(get(this.value[topic], 'properties.userProperties.timestamp', this.value[topic].timestamp / 1000)) * 1000
        if (time > timestamp) { timestamp = time }
        return timestamp
      }, 0)
    },
    timestamp () {
      const timestamp = this.time,
        now = new Date(Date.now()),
        time = new Date(timestamp)
      let format = 'DD/MM HH:mm:ss'
      if (now.getDate() + now.getMonth() === time.getDate() + time.getMonth()) {
        format = 'HH:mm:ss'
      }
      return timestamp ? date.formatDate(timestamp, format) : ''
    }
  }
}
