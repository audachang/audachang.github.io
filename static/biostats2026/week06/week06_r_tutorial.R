# Week 06 Part 1｜R 實作：Bootstrap、相關與簡單線性迴歸
# HT3001B 生物統計學與 R｜2026-10-15
# 資料：openintro::births14（openintro 2.5.1 核對）。在 Project 根目錄執行。

# ---- Bootstrap：第五週方法的 R 實現（只用 base R）----
# 自編 12 筆資料只示範步驟；小樣本不能保證 CI 的涵蓋率。
x <- c(9.1, 10.4, 11.8, 8.7, 14.2, 10.9,
       12.5, 9.8, 23.0, 10.1, 11.2, 9.5)
n <- length(x)
mean(x)

set.seed(73)
boot_one <- sample(x, size = n, replace = TRUE)
boot_one
mean(boot_one)

# 每個區塊自行固定 seed，不依賴第五週先執行其他模擬的狀態。
set.seed(1008)
B <- 10000
boot_means <- replicate(
  B, mean(sample(x, size = n, replace = TRUE))
)
length(boot_means)
head(boot_means)

hist(boot_means, breaks = 30, col = "grey80",
     main = "Bootstrap means", xlab = "Resampled mean")
abline(v = mean(x), col = "darkorange", lwd = 2)

sd(x)  # 原始觀察值的散布
boot_se <- sd(boot_means)  # 平均數的 bootstrap SE
boot_ci <- quantile(boot_means, probs = c(0.025, 0.975))
boot_se
boot_ci
sd(x) / sqrt(n)  # 與第五週平均數 SE 公式比較

set.seed(1008)
boot_medians <- replicate(
  B, median(sample(x, size = n, replace = TRUE))
)
median(x)
sd(boot_medians)
quantile(boot_medians, probs = c(0.025, 0.975))

# 練習的核對：不放回抽完全部資料，只會改變順序。
set.seed(1008)
wrong <- replicate(
  B, mean(sample(x, size = n, replace = FALSE))
)
sd(wrong)

# 選讀：第五週的 SE 法；僅在 bootstrap 分布近似對稱鐘形時考慮。
# 此示範的平均數分布偏右，不能只看程式可執行就認定方法合適。
mean(x) + c(-1, 1) * 1.96 * boot_se

# ---- 0. 套件與資料 ----
# install.packages(c("openintro", "dplyr", "ggplot2", "readr"))  # 尚未安裝時執行一次
library(openintro)
library(dplyr)
library(ggplot2)
library(readr)

data("births14", package = "openintro")
dat <- births14

# ---- 套用 bootstrap：平均出生體重（不是個別體重範圍）----
w <- dat$weight[!is.na(dat$weight)]
set.seed(1008)
boot_weight <- replicate(
  B, mean(sample(w, size = length(w), replace = TRUE))
)
length(w)
mean(w)
sd(boot_weight)
quantile(boot_weight, probs = c(0.025, 0.975))
# 將每列視為獨立且具代表性的觀察；bootstrap 無法補救抽樣偏差。

glimpse(dat)

dat |>
  summarise(
    n_rows = n(),
    fage_missing = sum(is.na(fage)),
    mage_missing = sum(is.na(mage)),
    weeks_missing = sum(is.na(weeks)),
    weight_missing = sum(is.na(weight))
  )

# ---- 1. 相關問題：母親與父親的年齡 ----
ages <- dat |>
  filter(!is.na(mage), !is.na(fage))

nrow(ages)

p_ages <- ggplot(ages, aes(x = mage, y = fage)) +
  geom_point(alpha = 0.4) +
  labs(x = "Mother's age (years)", y = "Father's age (years)") +
  theme_minimal()
p_ages

ages |>
  filter(fage >= 60) |>
  select(mage, fage, weeks, weight)

cor(ages$mage, ages$fage)
cor(ages$fage, ages$mage)
cor(ages$mage, ages$fage, method = "spearman")

cor(dat$mage, dat$fage)
cor(dat$mage, dat$fage, use = "complete.obs")

cor.test(~ mage + fage, data = ages)
cor.test(~ mage + fage, data = ages, method = "spearman", exact = FALSE)

# 敏感度分析：暫時排除 fage = 85 的一筆，比較 r（原始資料不刪）
ages |>
  filter(fage != 85) |>
  summarise(
    n = n(),
    pearson = cor(mage, fage),
    spearman = cor(mage, fage, method = "spearman")
  )

# ---- 2. 迴歸問題：用懷孕週數預測出生體重 ----
bw <- dat |>
  filter(!is.na(weeks), !is.na(weight))

nrow(bw)
range(bw$weeks)

set.seed(1015)
p_bw <- ggplot(bw, aes(x = weeks, y = weight)) +
  geom_jitter(width = 0.2, height = 0, alpha = 0.3) +
  labs(x = "Gestation (weeks)", y = "Birth weight (lb)") +
  theme_minimal()
p_bw

fit <- lm(weight ~ weeks, data = bw)
fit
coef(fit)
summary(fit)

summary(fit)$r.squared
cor(bw$weeks, bw$weight)^2

bw |>
  summarise(
    r = cor(weeks, weight),
    s_x = sd(weeks),
    s_y = sd(weight),
    b1 = r * s_y / s_x,
    b0 = mean(weight) - b1 * mean(weeks)
  )

set.seed(1015)
p_bw_line <- p_bw +
  geom_smooth(method = "lm", formula = y ~ x, se = FALSE, color = "darkorange")
p_bw_line

# 核對 R2：同一批資料、含截距的單一變項最小平方迴歸
sst <- sum((bw$weight - mean(bw$weight))^2)
sse <- sum(resid(fit)^2)
1 - sse / sst

# ---- 3. 殘差 ----
bw_fit <- bw |>
  mutate(
    fitted = fitted(fit),
    resid = resid(fit)
  )

bw_fit |>
  select(weeks, weight, fitted, resid) |>
  head()

p_resid <- ggplot(bw_fit, aes(x = fitted, y = resid)) +
  geom_point(alpha = 0.3) +
  geom_hline(yintercept = 0, linetype = "dashed") +
  labs(x = "Fitted birth weight (lb)", y = "Residual (lb)") +
  theme_minimal()
p_resid

resid_by_weeks <- bw_fit |>
  mutate(weeks_group = cut(weeks, breaks = c(20, 32, 36, 38, 40, 42, 46))) |>
  group_by(weeks_group) |>
  summarise(
    n = n(),
    mean_resid = mean(resid),
    sd_resid = sd(resid)
  )
resid_by_weeks

# ---- 4. 限制研究對象與週數範圍：不等於單點影響診斷 ----
bw_term <- bw |>
  filter(weeks >= 37)

nrow(bw_term)

fit_term <- lm(weight ~ weeks, data = bw_term)
coef(fit_term)
summary(fit_term)$r.squared
sd(bw$weeks)
sd(bw_term$weeks)

cor(bw$weeks, bw$weight, method = "spearman")

# ---- 5. 交換 x 與 y、預測與外插 ----
fit_reverse <- lm(weeks ~ weight, data = bw)
coef(fit_reverse)
coef(fit)[2] * coef(fit_reverse)[2]  # 等於同樣本的 r^2

predict(fit, newdata = data.frame(weeks = c(39, 10)))

# ---- 6. 保存 ----
dir.create("output", showWarnings = FALSE)
write_csv(resid_by_weeks, "output/week06_resid_by_weeks.csv")
ggsave("output/week06_weeks_weight.png", p_bw_line, width = 6, height = 4, dpi = 150)
ggsave("output/week06_residuals.png", p_resid, width = 6, height = 4, dpi = 150)
file.exists(c("output/week06_resid_by_weeks.csv",
              "output/week06_weeks_weight.png",
              "output/week06_residuals.png"))

sessionInfo()

# ---- 延伸閱讀（選讀）：斜率的標準誤與信賴區間 ----
# 主線只讀係數與 R²；以下兩行可獨立選擇執行。
# Std. Error 是係數的不確定性，並非個別體重的預測誤差。
summary(fit)$coefficients[, "Std. Error"]
confint(fit)
