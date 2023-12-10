export const retryExpectAsync = async (expectFn: () => Promise<void>, retryDelay, maxRetries) => {
  let retries = 0
  while (retries < maxRetries - 1) {
    try {
      console.debug(Date.now(), "retryExpectAsync() attempt:", retries)
      await expectFn()
      console.debug(Date.now(), "retryExpectAsync() success")
      return
    } catch (e) {
      console.debug(Date.now(), "retryExpectAsync() caught error:", e)
      retries++
      await new Promise((resolve) => setTimeout(resolve, retryDelay))
    }
  }

  // Do not wrap last retry in try-catch block to capture failures
  await expectFn()
}
