# Week 11 Part Four: two-way ANOVA, independently runnable in a fresh R session.
# Original Rosner 8e Table 12.33 summary reconstruction: means 8.6, 5.3, 4.9, 1.1.
# NOT individual original data; cannot be used to validate distribution assumptions.
# Do not substitute the Part Two correction-demo CSV (mean changed to 6.4).
if (!file.exists("week11_counseling_reconstructed.csv")) {
  stop("Place the original-summary counseling CSV in the current working directory.")
}

# D. Two-way ANOVA: reconstructed counseling data (balanced 2 x 2) ----------------
cs <- read.csv("week11_counseling_reconstructed.csv")
cs$weight <- factor(cs$weight, levels = c("no", "yes"))
cs$meditation <- factor(cs$meditation, levels = c("no", "yes"))
print(with(cs, table(weight, meditation)))
cm <- with(cs, tapply(dbp_decrease, list(weight, meditation), mean))
print(cm)

with(cs, interaction.plot(
  meditation, weight, dbp_decrease, type = "b",
  xlab = "Meditation counseling", ylab = "Mean DBP decrease (mm Hg)",
  trace.label = "Weight counseling", col = c("grey35", "#B64C14"),
  lty = c(1, 2), pch = c(16, 15), lwd = 2
))

fit_full <- aov(dbp_decrease ~ weight * meditation, data = cs)
print(summary(fit_full))

# Step by step for a balanced design (equal n per cell); not valid for unequal n.
n_cell <- 20
grand2 <- mean(cm)
row_m <- rowMeans(cm)                                  # weight counseling margins
col_m <- colMeans(cm)                                  # meditation counseling margins
additive <- outer(row_m, col_m, "+") - grand2
dev <- cm - additive
print(list(row_means = row_m, col_means = col_m, additive = additive, deviation = dev))
ss_w <- ncol(cm) * n_cell * sum((row_m - grand2)^2)
ss_m <- nrow(cm) * n_cell * sum((col_m - grand2)^2)
ss_i <- n_cell * sum(dev^2)
cell_mean_each <- ave(cs$dbp_decrease, cs$weight, cs$meditation)
ss_e <- sum((cs$dbp_decrease - cell_mean_each)^2)
df_e <- nrow(cs) - length(cm)
ms_e <- ss_e / df_e
two_way_hand <- data.frame(
  term = c("weight", "meditation", "weight:meditation", "Residuals"),
  df = c(1, 1, 1, df_e), ss = c(ss_w, ss_m, ss_i, ss_e),
  ms = c(ss_w, ss_m, ss_i, ms_e)
)
two_way_hand$F <- c(two_way_hand$ms[1:3] / ms_e, NA)
two_way_hand$p <- c(pf(two_way_hand$F[1:3], 1, df_e, lower.tail = FALSE), NA)
print(two_way_hand)
stopifnot(all.equal(two_way_hand$ss, summary(fit_full)[[1]][, "Sum Sq"], check.attributes = FALSE))

# Exercise 1: the additive model moves the interaction SS into the residual.
fit_add <- aov(dbp_decrease ~ weight + meditation, data = cs)
print(summary(fit_add))
print(c(residual_full = ss_e, residual_additive = ss_e + ss_i))
