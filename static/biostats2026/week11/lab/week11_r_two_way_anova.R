# Week 11 Part Four: two-way ANOVA, independently runnable in a fresh R session.
# Original Rosner 8e Table 12.33 summary reconstruction: means 8.6, 5.3, 4.9, 1.1.
# NOT individual original data; cannot be used to validate distribution assumptions.
# Do not substitute the Part Two correction-demo CSV (mean changed to 6.4).
if (!file.exists("week11_counseling_reconstructed.csv")) {
  stop("Place the original-summary counseling CSV in the current working directory.")
}

library(dplyr)

# D. Two-way ANOVA: reconstructed counseling data (balanced 2 x 2) ----------------
cs <- read.csv("week11_counseling_reconstructed.csv") |>
  mutate(
    weight = factor(weight, levels = c("no", "yes")),
    meditation = factor(meditation, levels = c("no", "yes"))
  )
cell_summary <- cs |>
  group_by(weight, meditation) |>
  summarise(
    n = n(), mean_dbp = mean(dbp_decrease),
    ss_within = sum((dbp_decrease - mean(dbp_decrease))^2),
    .groups = "drop"
  )
print(cell_summary)

with(cs, interaction.plot(
  meditation, weight, dbp_decrease, type = "b",
  xlab = "Meditation counseling", ylab = "Mean DBP decrease (mm Hg)",
  trace.label = "Weight counseling", col = c("grey35", "#B64C14"),
  lty = c(1, 2), pch = c(16, 15), lwd = 2
))

fit_full <- aov(dbp_decrease ~ weight * meditation, data = cs)
print(summary(fit_full))

# Balanced design: A = weight counseling, B = meditation counseling.
cm <- xtabs(mean_dbp ~ weight + meditation, data = cell_summary)
a <- nrow(cm)
b <- ncol(cm)
n_cell <- cell_summary$n[1]
stopifnot(nrow(cell_summary) == a * b,
          n_cell > 1, all(cell_summary$n == n_cell))
grand <- mean(cm)
row_m <- rowMeans(cm)
col_m <- colMeans(cm)
additive <- outer(row_m, col_m, "+") - grand
dev <- cm - additive
print(list(row_means = row_m, col_means = col_m, additive = additive, deviation = dev))

ss_a <- b * n_cell * sum((row_m - grand)^2)
ss_b <- a * n_cell * sum((col_m - grand)^2)
ss_ab <- n_cell * sum(dev^2)
ss_e <- sum(cell_summary$ss_within)
ss_c <- n_cell * sum((cm - grand)^2)
ss_t <- sum((cs$dbp_decrease - grand)^2)
stopifnot(
  isTRUE(all.equal(ss_c, ss_a + ss_b + ss_ab)),
  isTRUE(all.equal(ss_t, ss_c + ss_e))
)

df <- c(a - 1, b - 1, (a - 1) * (b - 1), a * b * (n_cell - 1))
ss <- c(ss_a, ss_b, ss_ab, ss_e)
ms <- ss / df
f_values <- ms[1:3] / ms[4]

two_way_hand <- data.frame(
  term = c("weight", "meditation", "weight:meditation",
           "Residuals", "Total"),
  df = c(df, a * b * n_cell - 1),
  SS = c(ss, ss_t), MS = c(ms, NA_real_),
  F = c(f_values, NA_real_, NA_real_),
  p = c(pf(f_values, df[1:3], df[4], lower.tail = FALSE),
        NA_real_, NA_real_)
)
print(two_way_hand)
r_table <- summary(fit_full)[[1]]
stopifnot(
  isTRUE(all.equal(two_way_hand$df[1:4], r_table[, "Df"])),
  isTRUE(all.equal(two_way_hand$SS[1:4], r_table[, "Sum Sq"])),
  isTRUE(all.equal(two_way_hand$MS[1:4], r_table[, "Mean Sq"])),
  isTRUE(all.equal(two_way_hand$F[1:4], r_table[, "F value"])),
  isTRUE(all.equal(two_way_hand$p[1:4], r_table[, "Pr(>F)"]))
)

# Exercise 1: the additive model moves the interaction SS into the residual.
fit_add <- aov(dbp_decrease ~ weight + meditation, data = cs)
print(summary(fit_add))
print(c(residual_full = ss_e, residual_additive = ss_e + ss_ab))
