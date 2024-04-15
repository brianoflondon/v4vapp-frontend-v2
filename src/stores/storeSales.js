import { defineStore } from "pinia"
import { useStorage } from "@vueuse/core"

export const useStoreSales = defineStore("storeSales", {
  state: () => ({
    requestedSales: useStorage("sales", []),
  }),

  getters: {
    salesUnpaid() {
      // filter for unpaid sales
      return this.requestedSales.filter((sale) => !sale.paid)
    },
    salesPaid() {
      // filter for paid sales
      return this.requestedSales.filter((sale) => sale.paid)
    },
    salesAll() {
      // filter for all sales
      // sort this by timestampUnix descending
      return this.requestedSales
    },
  },

  actions: {
    addSale(sale) {
      // insert in reverse order
      this.requestedSales.unshift(sale)
    },

    updateSale(sale) {
      const index = this.requestedSales.findIndex(
        (s) => s.checkCode === sale.checkCode
      )
      if (index === -1) {
        this.addSale(sale)
      } else {
        // Update only the properties of the sale that have changed
        Object.assign(this.requestedSales[index], sale)
      }
    },
    markAsLightning(checkCode) {
      const index = this.requestedSales.findIndex(
        (s) => s.checkCode === checkCode
      )
      this.requestedSales[index].lightning = true
    },
    markAsHive(checkCode) {
      const index = this.requestedSales.findIndex(
        (s) => s.checkCode === checkCode
      )
      this.requestedSales[index].lightning = false
    },
    removeSale(checkCode) {
      const index = this.requestedSales.findIndex(
        (s) => s.checkCode === checkCode
      )
      if (index !== -1) {
        this.requestedSales.splice(index, 1)
      }
    },
    markPaid(checkCode, trx_id, hiveAccFrom, amountPaid) {
      const index = this.requestedSales.findIndex(
        (sale) => sale.checkCode === checkCode
      )
      if (index !== -1) {
        this.requestedSales[index].paid = true
        this.requestedSales[index].trx_id = trx_id
        this.requestedSales[index].hiveAccFrom = hiveAccFrom
        this.requestedSales[index].paidDate = new Date()
        this.requestedSales[index].amountPaid = amountPaid
      }
    },
    findSale(checkCode) {
      return this.requestedSales.find((sale) => sale.checkCode === checkCode)
    },
    clearSales() {
      this.requestedSales = []
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ["sales"],
      },
    ],
  },
})
