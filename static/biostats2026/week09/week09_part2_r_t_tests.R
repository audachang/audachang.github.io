# Week 09 Part 2｜用 R 做三種 t 檢定
# HT3001B 生物統計學與 R
#
# 對應 Week 09 t 檢定投影片的三個案例：
#   A. 單一樣本 t：大鼠迷宮（只有摘要統計量）
#   B. 獨立樣本 t：網路搜尋組 vs. 非搜尋組（只有摘要統計量）
#   C. 配對 t：影片前測與後測（20 人完整資料，week09_part2_film_attitude.csv）
#
# A、B 的原始逐筆資料不在課堂材料中。程式先用摘要統計量計算，
# 再以 make_demo() 構造「示範資料」練習 t.test()。示範資料只對齊
# 樣本數、平均數與標準差，不是原研究的作答資料。
#
# 執行前：把本檔與 week09_part2_film_attitude.csv 放在同一個 RStudio Project。
# 本檔只使用 base R 與 stats 套件。

# ------------------------------------------------------------
# 0. 工具：t 分布的 p 值與臨界值
# ------------------------------------------------------------
# pt(q, df)：左尾面積 P(T <= q)
# qt(p, df)：左尾面積為 p 的分位數
qt(0.975, df = 24)              # 雙尾 alpha = .05 的正側臨界值
2 * pt(-abs(2.57), df = 24)     # 雙尾 p 值：左尾面積 x 2

# 構造示範資料：先標準化亂數，平均與標準差就能精確對齊指定值
make_demo <- function(n, mean, sd) {
  z <- rnorm(n)
  z <- (z - mean(z)) / sd(z)
  mean + sd * z
}

# ------------------------------------------------------------
# A. 單一樣本 t 檢定：大鼠迷宮
#    H0: mu = 60, H1: mu != 60, alpha = .05
# ------------------------------------------------------------
n    <- 25
xbar <- 66
mu0  <- 60
SS   <- 3259

s2     <- SS / (n - 1)          # 樣本變異數
se     <- sqrt(s2 / n)          # 估計標準誤
t_rat  <- (xbar - mu0) / se
df_rat <- n - 1
p_rat  <- 2 * pt(-abs(t_rat), df = df_rat)
crit_rat <- qt(1 - 0.05 / 2, df = df_rat)
c(s2 = s2, se = se, t = t_rat, df = df_rat, p = p_rat, crit = crit_rat)

# 有逐筆資料時：t.test() 一行完成
set.seed(1105)
rat <- make_demo(n = 25, mean = 66, sd = sqrt(3259 / 24))
c(mean = mean(rat), SS = sum((rat - mean(rat))^2))   # 核對：66 與 3259

fit_rat <- t.test(rat, mu = 60)  # 預設雙尾、conf.level = 0.95
fit_rat
fit_rat$statistic                # t
fit_rat$parameter                # df
fit_rat$p.value
fit_rat$conf.int                 # mu 的 95% 信賴區間

# 單尾的寫法（本例事先設定雙尾，這裡只示範參數作用）
t.test(rat, mu = 60, alternative = "greater")$p.value

# ------------------------------------------------------------
# B. 獨立樣本 t 檢定（合併變異數）：網路搜尋
#    差的方向：搜尋組 - 非搜尋組
#    H0: mu1 - mu2 = 0, H1: != 0, alpha = .001
# ------------------------------------------------------------
n1 <- 93;  m1 <- 3.78; v1 <- 1.42   # 網路搜尋
n2 <- 102; m2 <- 3.07; v2 <- 1.25   # 非搜尋

df_pool <- (n1 - 1) + (n2 - 1)
sp2     <- ((n1 - 1) * v1 + (n2 - 1) * v2) / df_pool
se_pool <- sqrt(sp2 * (1 / n1 + 1 / n2))
t_pool  <- (m1 - m2) / se_pool
p_pool  <- 2 * pt(-abs(t_pool), df = df_pool)
crit_pool <- qt(1 - 0.001 / 2, df = df_pool)
c(sp2 = sp2, se = se_pool, t = t_pool, df = df_pool,
  p = p_pool, crit = crit_pool)

# 效果量：Cohen's d 與 Hedges' g
sp <- sqrt(sp2)
d  <- (m1 - m2) / sp
g  <- d * (1 - 3 / (4 * df_pool - 1))   # 常用的小樣本校正近似
c(sp = sp, d = d, g = g)

# 示範資料：長格式（long format），每列一人，一欄組別、一欄分數
set.seed(2015)
search <- data.frame(
  group = rep(c("search", "nonsearch"), times = c(n1, n2)),
  confidence = c(make_demo(n1, m1, sqrt(v1)),
                 make_demo(n2, m2, sqrt(v2)))
)
search$group <- factor(search$group, levels = c("search", "nonsearch"))
tapply(search$confidence, search$group, mean)
tapply(search$confidence, search$group, var)

# 合併法：var.equal = TRUE；conf.level 與 alpha = .001 對應
fit_pool <- t.test(confidence ~ group, data = search,
                   var.equal = TRUE, conf.level = 0.999)
fit_pool

# R 的預設是 Welch t 檢定（var.equal = FALSE）
fit_welch <- t.test(confidence ~ group, data = search)
fit_welch

rbind(pooled = c(fit_pool$statistic,  fit_pool$parameter,  p = fit_pool$p.value),
      welch  = c(fit_welch$statistic, fit_welch$parameter, p = fit_welch$p.value))

# 因子層級決定相減方向：改成 nonsearch 在前，t 變號
search$group2 <- factor(search$group, levels = c("nonsearch", "search"))
t.test(confidence ~ group2, data = search, var.equal = TRUE)$statistic

# ------------------------------------------------------------
# C. 配對 t 檢定：影片前測與後測
#    D = 前測 - 後測；H0: mu_D = 0, H1: != 0, alpha = .05
# ------------------------------------------------------------
film <- read.csv("week09_part2_film_attitude.csv")
str(film)                         # 寬格式（wide format）：每列一人，前後測各一欄

film$D <- film$pre - film$post
c(sum_D = sum(film$D), sum_D2 = sum(film$D^2))     # -152 與 2956
c(mean_D = mean(film$D), var_D = var(film$D), sd_D = sd(film$D))

n_pair <- nrow(film)
se_D   <- sd(film$D) / sqrt(n_pair)
t_film <- mean(film$D) / se_D
c(se = se_D, t = t_film, df = n_pair - 1,
  p = 2 * pt(-abs(t_film), df = n_pair - 1),
  crit = qt(0.975, df = n_pair - 1))

fit_paired <- t.test(film$pre, film$post, paired = TRUE)
fit_paired

# 等價：對差值做單一樣本 t
fit_diff <- t.test(film$D, mu = 0)
c(paired = fit_paired$statistic, diff = fit_diff$statistic)

# 常見錯誤：忘記 paired = TRUE，R 會當成兩組獨立樣本（Welch）
fit_wrong <- t.test(film$pre, film$post)
rbind(paired = c(fit_paired$statistic, fit_paired$parameter, p = fit_paired$p.value),
      wrong  = c(fit_wrong$statistic,  fit_wrong$parameter,  p = fit_wrong$p.value))

# 效果量 d_z：分母是差值的標準差
d_z <- mean(film$D) / sd(film$D)
d_z

# 畫圖：每條線是一位受試者
plot(c(1, 2), range(film[c("pre", "post")]), type = "n", xaxt = "n",
     xlab = "", ylab = "態度分數", xlim = c(0.7, 2.3))
axis(1, at = c(1, 2), labels = c("前測", "後測"))
segments(1, film$pre, 2, film$post, col = "grey50")

# ------------------------------------------------------------
# 附錄：網路搜尋案例的檢定力（常態近似）
# ------------------------------------------------------------
crit_diff <- crit_pool * se_pool           # 平均差刻度上的臨界位置
power_approx <- pnorm(crit_diff, mean = 0.71, sd = se_pool, lower.tail = FALSE) +
                pnorm(-crit_diff, mean = 0.71, sd = se_pool)
c(crit_diff = crit_diff, power = power_approx)
