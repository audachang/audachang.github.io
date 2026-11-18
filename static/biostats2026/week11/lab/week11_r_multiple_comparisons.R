# Week 11 Part Two: one-way setup, multiple comparisons, Tukey and FDR.
# Data: original R chickwts (three chosen feeds) and a teaching-adjusted
# reconstruction of Rosner 8e Table 12.33 (weight-only mean 5.3 -> 6.4).
# This CSV is NOT original textbook/clinical individual data.
if (!file.exists("week11_correction_demo_reconstructed.csv")) {
  stop("Place the correction-demo CSV in the current working directory.")
}

# B. One-way ANOVA: three feeds ------------------------------------------------
str(chickwts)
three <- subset(chickwts, feed %in% c("casein", "linseed", "sunflower"))
print(head(three))
three$feed <- factor(three$feed, levels = c("casein", "linseed", "sunflower"))
print(table(three$feed))
print(with(three, tapply(weight, feed, mean)))
# Condition check on the real data: group SDs (largest / smallest about 1.32).
group_sd <- with(three, tapply(weight, feed, sd))
print(group_sd)
print(max(group_sd) / min(group_sd))

fit <- aov(weight ~ feed, data = three)
print(summary(fit))
print(qf(.95, df1 = 2, df2 = 33))
f_obs <- summary(fit)[[1]][1, "F value"]
print(pf(f_obs, df1 = 2, df2 = 33, lower.tail = FALSE))

# Step by step: the same SS, MS, F and p.
n <- table(three$feed)
m <- tapply(three$weight, three$feed, mean)
grand <- mean(three$weight)
k <- length(m)
N <- nrow(three)
ss_group <- sum(n * (m - grand)^2)
ss_error <- sum((three$weight - m[three$feed])^2)   # m[three$feed]: each chick's own group mean
df_group <- k - 1
df_error <- N - k
ms_group <- ss_group / df_group
ms_error <- ss_error / df_error
f_hand <- ms_group / ms_error
p_hand <- pf(f_hand, df_group, df_error, lower.tail = FALSE)
one_way_hand <- data.frame(
  term = c("feed", "Residuals"), df = c(df_group, df_error),
  ss = c(ss_group, ss_error), ms = c(ms_group, ms_error),
  F = c(f_hand, NA), p = c(p_hand, NA)
)
print(one_way_hand)
stopifnot(all.equal(ss_group, summary(fit)[[1]][1, "Sum Sq"]),
          all.equal(f_hand, f_obs))

# Exercise 1: a numeric code uses 1 df; factor() restores the three groups.
three$code <- as.integer(three$feed)
print(summary(aov(weight ~ code, data = three)))
print(summary(aov(weight ~ factor(code), data = three)))

# C. Pairwise comparisons --------------------------------------------------------
print(TukeyHSD(fit))
print(pairwise.t.test(three$weight, three$feed, p.adjust.method = "none"))
print(pairwise.t.test(three$weight, three$feed, p.adjust.method = "bonferroni"))

# Step by step for all three pairs, using the pooled MSE from the ANOVA.
pairs <- t(combn(levels(three$feed), 2))
diff <- as.numeric(m[pairs[, 2]] - m[pairs[, 1]])    # later level minus earlier, as TukeyHSD
se <- as.numeric(sqrt(ms_error * (1 / n[pairs[, 1]] + 1 / n[pairs[, 2]])))
t_stat <- diff / se
p_raw <- 2 * pt(-abs(t_stat), df_error)
p_bonf <- pmin(1, length(p_raw) * p_raw)
q_crit <- qtukey(.95, nmeans = k, df = df_error)
tukey_mean_se <- sqrt(ms_error / 12)
q_obs <- abs(diff) / tukey_mean_se
tukey_half <- q_crit * tukey_mean_se           # equal n = 12 per group
p_tukey <- ptukey(q_obs, nmeans = k, df = df_error, lower.tail = FALSE)
stopifnot(max(abs(q_obs - sqrt(2)*abs(t_stat))) < 1e-12)
print(c(mean_SE = tukey_mean_se, difference_SE = se[1], q_critical = q_crit, HSD = tukey_half))
pair_hand <- data.frame(
  pair = paste(pairs[, 2], pairs[, 1], sep = "-"), diff = as.numeric(diff),
  se = as.numeric(se), t = as.numeric(t_stat), q = as.numeric(q_obs), p_raw = as.numeric(p_raw),
  p_bonf = as.numeric(p_bonf), tukey_lwr = as.numeric(diff) - tukey_half,
  tukey_upr = as.numeric(diff) + tukey_half, p_tukey = as.numeric(p_tukey)
)
print(pair_hand)

# Holm step by step: sort, multiply by the number left, running maximum, cap at 1, restore order.
ord <- order(p_raw)
holm_sorted <- pmin(1, cummax((length(p_raw):1) * p_raw[ord]))
p_holm <- numeric(length(p_raw))
p_holm[ord] <- holm_sorted
print(data.frame(pair = pair_hand$pair[ord], p_raw = p_raw[ord],
                 multiplier = length(p_raw):1, holm = holm_sorted))
stopifnot(all.equal(p_holm, p.adjust(p_raw, "holm")))

# C2. Teaching-adjusted four-group example; not the original Rosner data.
# Only the weight-only mean is changed from 5.3 to 6.4. n and SD stay the same.
demo <- read.csv("week11_correction_demo_reconstructed.csv")
demo$group <- factor(demo$group,
  levels = c("neither", "meditation_only", "weight_only", "both"))
demo_fit <- aov(dbp_decrease ~ group, data = demo)
print(summary(demo_fit))
print(TukeyHSD(demo_fit))
demo_n <- table(demo$group)
demo_m <- tapply(demo$dbp_decrease, demo$group, mean)
demo_df <- nrow(demo) - length(demo_m)
demo_ss_error <- sum((demo$dbp_decrease - demo_m[demo$group])^2)
demo_mse <- demo_ss_error / demo_df
demo_pairs <- t(combn(levels(demo$group), 2))
demo_diff <- as.numeric(demo_m[demo_pairs[, 2]] - demo_m[demo_pairs[, 1]])
demo_se <- as.numeric(sqrt(demo_mse *
  (1/demo_n[demo_pairs[, 1]] + 1/demo_n[demo_pairs[, 2]])))
demo_t <- demo_diff / demo_se
demo_raw <- 2 * pt(-abs(demo_t), demo_df)
demo_count <- length(demo_raw)                 # six comparisons in the same family
demo_bonf <- pmin(1, demo_count * demo_raw)
demo_ord <- order(demo_raw)
demo_holm <- numeric(demo_count)
demo_holm[demo_ord] <- pmin(1, cummax((demo_count:1) * demo_raw[demo_ord]))

# Tukey: q uses sqrt(MSE/n), NOT the ordinary difference-SE sqrt(2*MSE/n).
demo_sq <- sqrt(demo_mse / 20)
demo_q <- abs(demo_diff) / demo_sq
demo_qcrit <- qtukey(.95, nmeans = 4, df = demo_df)
demo_half <- demo_qcrit * demo_sq
demo_tukey_p <- ptukey(demo_q, nmeans = 4, df = demo_df, lower.tail = FALSE)
demo_results <- data.frame(
  pair = paste(demo_pairs[, 2], demo_pairs[, 1], sep = "-"),
  diff = demo_diff, SE = demo_se, t = demo_t, raw = demo_raw,
  Bonferroni = demo_bonf, Holm = demo_holm, Tukey = demo_tukey_p,
  Tukey_lwr = demo_diff-demo_half, Tukey_upr = demo_diff+demo_half)
print(demo_results)
demo_tk <- TukeyHSD(demo_fit)$group[demo_results$pair, ]
stopifnot(max(abs(demo_results$Tukey-demo_tk[, "p adj"])) < 1e-10,
          max(abs(demo_results$Tukey_lwr-demo_tk[, "lwr"])) < 1e-8,
          max(abs(demo_holm-p.adjust(demo_raw, "holm"))) < 1e-12,
          max(abs(demo_bonf-p.adjust(demo_raw, "bonferroni"))) < 1e-12)
print(demo_results[demo_results$pair == "weight_only-neither", ])

# C3. FDR with Benjamini-Hochberg: step-up decision and adjusted p-values.
# This .05 is the FDR target, not Tukey's studentized-range statistic q.
demo_fdr_target <- .05
demo_rank <- seq_len(demo_count)
demo_sorted <- demo_raw[demo_ord]
demo_bh_threshold <- (demo_rank / demo_count) * demo_fdr_target
demo_bh_k <- max(c(0, which(demo_sorted <= demo_bh_threshold)))
demo_bh_reject_sorted <- demo_rank <= demo_bh_k
print(data.frame(rank = demo_rank, raw = demo_sorted,
                 BH_threshold = demo_bh_threshold, reject = demo_bh_reject_sorted))

# Multiply by m/i, take the running minimum FROM THE BOTTOM, cap at 1,
# then restore the input order. Do not stop at the first failing row.
demo_bh_candidate <- (demo_count / demo_rank) * demo_sorted
demo_bh_sorted <- pmin(1, rev(cummin(rev(demo_bh_candidate))))
demo_bh <- numeric(demo_count)
demo_bh[demo_ord] <- demo_bh_sorted
print(data.frame(rank = demo_rank, raw = demo_sorted,
                 candidate = demo_bh_candidate, BH_adjusted = demo_bh_sorted))
demo_results$BH <- demo_bh
print(demo_results[demo_results$pair == "weight_only-neither", ])
stopifnot(max(abs(demo_bh-p.adjust(demo_raw, "BH"))) < 1e-12,
          identical(demo_bh_sorted <= demo_fdr_target, demo_bh_reject_sorted))

# Optional step-up illustration: rank 1 fails its bound, yet ranks 1:5 are rejected.
bh_toy <- c(.009, .014, .026, .031, .040, .20)
bh_toy_k <- max(c(0, which(bh_toy <= (1:6)/6*.05)))
print(c(largest_passing_rank = bh_toy_k, rejects = sum(p.adjust(bh_toy, "BH") <= .05)))
# In real data V (the number of false rejections) is unknown. These adjusted
# p-values do not reveal the realized false-discovery proportion V/max(R,1).



# Appendix: optional Week 10 power/sample-size review
# A. Power and sample size ---------------------------------------------------
heart_n <- power.t.test(
  delta = 5, sd = 10, power = .80, type = "one.sample",
  sig.level = .05, strict = TRUE
)
search_n <- power.t.test(
  delta = .71, sd = 1.154, power = .80, type = "two.sample",
  sig.level = .05, strict = TRUE
)
# Sensitivity of one two-sample test to its own alpha; not a joint power design
# for a three-group ANOVA plus multiple comparisons.
search_n_bonf3 <- power.t.test(
  delta = .71, sd = 1.154, power = .80, type = "two.sample",
  sig.level = .05 / 3, strict = TRUE
)
search_n_strict_alpha <- power.t.test(
  delta = .71, sd = 1.154, power = .80, type = "two.sample",
  sig.level = .001, strict = TRUE
)
print(c(
  heart_sample = ceiling(heart_n$n),
  search_per_group = ceiling(search_n$n),
  search_per_group_alpha_05_3 = ceiling(search_n_bonf3$n),
  search_per_group_alpha_001 = ceiling(search_n_strict_alpha$n)
))

# By hand with the Week 10 normal approximation (z instead of t), per group:
# n = 2 * ((z_{1 - alpha/2} + z_{power}) * sd / delta)^2.
# It gives 41.5 -> 42, one fewer than the t-based power.t.test() answer of 43.
z_n <- 2 * ((qnorm(.975) + qnorm(.80)) * 1.154 / .71)^2
print(c(normal_approx = z_n, t_based = search_n$n))

search_power_30 <- power.t.test(
  n = 30, delta = .71, sd = 1.154, type = "two.sample",
  sig.level = .05, strict = TRUE
)
print(search_power_30$power)

