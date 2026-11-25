# Rosner, Fundamentals of Biostatistics, 8th ed., Table 12.24, p. 615.
# Run from the Week 12 directory or the course root.
data_path <- "week12_part2_tbut_raw.csv"
if (!file.exists(data_path)) {
  data_path <- file.path("lectures", "week12", data_path)
}
raw <- read.csv(data_path)
timepoints <- c("baseline", "immediate", "min5", "min10", "min15")
raw$timepoint <- factor(raw$timepoint, levels = timepoints)
readings <- raw[c("reading_1_seconds", "reading_2_seconds")]
stopifnot(!anyNA(raw), !anyDuplicated(raw[c("patient", "timepoint")]))

# Average each pair, then form a matrix with one row per patient.
raw$cell_mean <- rowMeans(readings)
Y <- with(raw, tapply(cell_mean, list(patient, timepoint), identity))
stopifnot(identical(dim(Y), c(14L, 5L)), !anyNA(Y))

# Reproduce patient 1's baseline prediction and residual.
patient_mean <- mean(Y[1, ])
baseline_mean <- mean(Y[, "baseline"])
grand_mean <- mean(Y)
predicted <- patient_mean + baseline_mean - grand_mean
print(c(patient_mean = patient_mean, baseline_mean = baseline_mean,
        grand_mean = grand_mean, predicted = predicted,
        residual = Y[1, "baseline"] - predicted))

# Orthogonal unit-length contrasts remove the overall level.
C <- qr.Q(qr(contr.helmert(ncol(Y))))
S <- cov(Y %*% C)
q <- ncol(S)
trS <- sum(diag(S))
print(round(S, 4))

# Mauchly's W from S, and the base R test for sphericity.
W <- det(S) / (trS / q)^q
fit <- lm(Y ~ 1)
print(c(trace = trS, determinant = det(S), W = W))
print(mauchly.test(fit, X = ~1))

# For symmetric S, the trace of the matrix product S %*% S is sum(S^2).
eps_GG <- trS^2 / (q * sum(S^2))
print(c(trace_S_squared = sum(S^2), epsilon_GG = eps_GG))
time_anova <- anova(fit, X = ~1, test = "Spherical")
print(time_anova)

# Use the original F with both degrees of freedom adjusted.
df_GG <- unlist(time_anova[1, c("num Df", "den Df")]) * eps_GG
p_GG <- pf(time_anova[1, "F"], df_GG[1], df_GG[2], lower.tail = FALSE)
print(c(df_GG, p_GG = p_GG))
