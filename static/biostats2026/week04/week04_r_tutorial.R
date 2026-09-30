# HT3001B Week04 Part 1: distribution summaries
# Run from the RStudio Project root. Data are fictional teaching examples.
# If needed, run once: install.packages(c("dplyr", "readr", "ggplot2"))
library(dplyr)
library(readr)
library(ggplot2)

dat <- read_csv("data/week04_completion_times.csv", na = c("", "NA"),
                show_col_types = FALSE)
glimpse(dat)
head(dat)
dat |> count(group)
dat |> filter(is.na(completion_min))

# Preserve dat; use only observed times for this variable's summaries.
dat_observed <- dat |> filter(!is.na(completion_min))
dat |> summarise(n_rows = n(), n_observed = sum(!is.na(completion_min)),
                 n_missing = sum(is.na(completion_min)))

p_hist5 <- ggplot(dat_observed, aes(x = completion_min)) +
  geom_histogram(binwidth = 5, boundary = 0, color = "white", fill = "grey40") +
  labs(x = "Completion time (minutes)", y = "Number of students") +
  theme_minimal()
print(p_hist5)
p_hist2 <- ggplot(dat_observed, aes(x = completion_min)) +
  geom_histogram(binwidth = 2, boundary = 0, color = "white", fill = "grey40") +
  labs(x = "Completion time (minutes)", y = "Number of students") +
  theme_minimal()
print(p_hist2)

summary_all <- dat |> summarise(
  n_rows = n(), n_observed = sum(!is.na(completion_min)),
  n_missing = sum(is.na(completion_min)),
  mean_min = mean(completion_min, na.rm = TRUE),
  median_min = median(completion_min, na.rm = TRUE),
  sd_min = sd(completion_min, na.rm = TRUE),
  q1_min = quantile(completion_min, 0.25, na.rm = TRUE, type = 7),
  q3_min = quantile(completion_min, 0.75, na.rm = TRUE, type = 7),
  iqr_min = IQR(completion_min, na.rm = TRUE, type = 7),
  min_min = min(completion_min, na.rm = TRUE),
  max_min = max(completion_min, na.rm = TRUE))
print(summary_all, width = Inf)

summary_group <- dat |> group_by(group) |> summarise(
  n_rows = n(), n_observed = sum(!is.na(completion_min)),
  n_missing = sum(is.na(completion_min)),
  mean_min = mean(completion_min, na.rm = TRUE),
  median_min = median(completion_min, na.rm = TRUE),
  sd_min = sd(completion_min, na.rm = TRUE),
  q1_min = quantile(completion_min, 0.25, na.rm = TRUE, type = 7),
  q3_min = quantile(completion_min, 0.75, na.rm = TRUE, type = 7),
  iqr_min = IQR(completion_min, na.rm = TRUE, type = 7),
  min_min = min(completion_min, na.rm = TRUE),
  max_min = max(completion_min, na.rm = TRUE), .groups = "drop")
print(summary_group, width = Inf)

# Boxplot flags are prompts to check records, not instructions to delete them.
p_box <- ggplot(dat_observed, aes(x = group, y = completion_min)) +
  geom_boxplot(outlier.shape = NA, fill = "grey90") +
  geom_point(position = position_jitter(width = 0.08, height = 0, seed = 4),
             alpha = 0.8) +
  labs(x = "Group", y = "Completion time (minutes)") + theme_minimal()
print(p_box)

# Part 2: small examples for hand calculations and sensitivity comparisons.
x <- c(6, 7, 8, 9, 10)
x_extreme <- c(6, 7, 8, 9, 30)
hand_examples <- data.frame(
  scenario = c("original", "replace_10_with_30"),
  mean = c(mean(x), mean(x_extreme)),
  median = c(median(x), median(x_extreme)),
  variance = c(var(x), var(x_extreme)),
  sd = c(sd(x), sd(x_extreme)),
  q1 = c(quantile(x, .25, type = 7), quantile(x_extreme, .25, type = 7)),
  q3 = c(quantile(x, .75, type = 7), quantile(x_extreme, .75, type = 7)),
  iqr = c(IQR(x, type = 7), IQR(x_extreme, type = 7)),
  range_width = c(diff(range(x)), diff(range(x_extreme))))
print(hand_examples)
z <- c(2, 2, 8, 8)
print(data.frame(mean = mean(z), median = median(z),
                 variance = var(z), sd = sd(z),
                 q1 = quantile(z, .25, type = 7),
                 q3 = quantile(z, .75, type = 7), iqr = IQR(z, type = 7)))

dir.create("output", showWarnings = FALSE)
write_csv(summary_all, "output/summary_all.csv")
write_csv(summary_group, "output/summary_by_group.csv")
write_csv(hand_examples, "output/hand_examples.csv")
ggsave("output/histogram_binwidth5.png", p_hist5, width = 7, height = 4, dpi = 150)
ggsave("output/histogram_binwidth2.png", p_hist2, width = 7, height = 4, dpi = 150)
ggsave("output/boxplot_by_group.png", p_box, width = 7, height = 4, dpi = 150)
writeLines(capture.output(sessionInfo()), "output/sessionInfo.txt")
