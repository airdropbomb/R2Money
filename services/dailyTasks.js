const { swapUSDCtoR2USD, swapR2USDtoUSDC } = require('./swap');
const { stakeR2USD } = require('./stake');
const { EMOJI, colorText, COLORS } = require('../utils/colors');

// Delay function to wait for a specified time (in milliseconds)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let dailyTasks = {
  usdcToR2usd: { enabled: false, amount: 0, numTxs: 0 },
  r2usdToUsdc: { enabled: false, amount: 0, numTxs: 0 },
  stakeR2usd: { enabled: false, amount: 0, numTxs: 0 },
};

async function executeDailyTasks(wallets) {
  console.log(`\n${EMOJI.INFO} ${colorText('Starting daily tasks execution...', COLORS.WHITE)}`);
  for (const wallet of wallets) {
    if (dailyTasks.usdcToR2usd.enabled) {
      await executeDailyTask(wallet, 'USDC to R2USD', dailyTasks.usdcToR2usd.amount, dailyTasks.usdcToR2usd.numTxs);
    }
    if (dailyTasks.r2usdToUsdc.enabled) {
      await executeDailyTask(wallet, 'R2USD to USDC', dailyTasks.r2usdToUsdc.amount, dailyTasks.r2usdToUsdc.numTxs);
    }
    if (dailyTasks.stakeR2usd.enabled) {
      await executeDailyTask(wallet, 'Stake R2USD', dailyTasks.stakeR2usd.amount, dailyTasks.stakeR2usd.numTxs);
    }
  }
  console.log(`${EMOJI.SUCCESS} ${colorText('Daily tasks execution completed.', COLORS.GREEN)}`);
}

async function executeDailyTask(wallet, taskType, amount, numTxs) {
  console.log(`\n${EMOJI.LOADING} ${colorText(`Executing daily ${taskType} for wallet ${wallet.address} on ${wallet.networkKey}`, COLORS.YELLOW)}`);
  for (let i = 1; i <= numTxs; i++) {
    console.log(`${EMOJI.LOADING} ${colorText(`Transaction ${i} of ${numTxs} (Amount: ${amount})`, COLORS.YELLOW)}`);
    let success = false;
    let retries = 3; // Maximum 3 retries

    // Retry loop
    while (retries > 0 && !success) {
      try {
        if (taskType === 'USDC to R2USD') {
          success = await swapUSDCtoR2USD(wallet, amount);
        } else if (taskType === 'R2USD to USDC') {
          success = await swapR2USDtoUSDC(wallet, amount);
        } else if (taskType === 'Stake R2USD') {
          success = await stakeR2USD(wallet, amount);
        }

        if (success) {
          console.log(`${EMOJI.SUCCESS} ${colorText(`Transaction ${i} completed successfully!`, COLORS.GREEN)}`);
        } else {
          throw new Error('Transaction failed');
        }
      } catch (error) {
        retries--;
        console.error(`${EMOJI.ERROR} ${colorText(`Transaction ${i} failed: ${error.message}. ${retries} retries left.`, COLORS.RED)}`);
        if (retries > 0) {
          console.log(`${EMOJI.CLOCK} ${colorText(`Waiting 10 seconds before retrying...`, COLORS.CYAN)}`);
          await delay(10000); // 10-second delay before retry
        }
      }
    }

    if (!success) {
      console.error(`${EMOJI.ERROR} ${colorText(`Transaction ${i} failed after all retries. Moving to next transaction.`, COLORS.RED)}`);
    }

    // Add 30-second delay between transactions (except for the last one)
    if (i < numTxs) {
      console.log(`${EMOJI.CLOCK} ${colorText(`Waiting 30 seconds before next transaction...`, COLORS.CYAN)}`);
      await delay(30000); // 30-second delay
    }
  }
  console.log(`${EMOJI.SUCCESS} ${colorText(`Completed ${numTxs} ${taskType} transaction(s) for wallet ${wallet.address}.`, COLORS.GREEN)}`);
}

function startCountdown(wallets, durationMs) {
  const endTime = Date.now() + durationMs;
  const interval = setInterval(() => {
    const remainingMs = endTime - Date.now();
    if (remainingMs <= 0) {
      clearInterval(interval);
      console.log(`${EMOJI.CLOCK} ${colorText('Countdown finished! Starting next daily tasks...', COLORS.GREEN)}`);
      executeDailyTasks(wallets).then(() => startCountdown(wallets, durationMs));
    } else {
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      process.stdout.write(`\r${EMOJI.CLOCK} ${colorText(`Next execution in: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`, COLORS.CYAN)}`);
    }
  }, 1000);
}

module.exports = { dailyTasks, executeDailyTasks, executeDailyTask, startCountdown };
