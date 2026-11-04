# Week 09 R4，2026-11-05。先寫分析計畫，再逐段執行。
# 在本檔所在目錄執行 Rscript --vanilla week09_r4.R。
# 資料來源：OpenIntroStat/openintro 官方 data/*.rda；本課程隨附 CSV。
# 原始資料與研究說明：https://openintrostat.github.io/openintro/reference/stem_cell.html
# 本程式僅使用 R 內建套件。
dir.create('verification', showWarnings=FALSE)
dir.create('assets/r4', recursive=TRUE, showWarnings=FALSE)
if (file.exists('data/births14.rda')) {
  load('data/births14.rda'); load('data/stem_cell.rda')
  write.csv(births14,'births14.csv',row.names=FALSE,na='')
  write.csv(stem_cell,'stem_cell.csv',row.names=FALSE,na='')
} else {
  births14 <- read.csv('births14.csv', na.strings=c('', 'NA'))
  stem_cell <- read.csv('stem_cell.csv', na.strings=c('', 'NA'))
}
# 1. 問題、變項、缺失及兩組摘要。只排除本題必要欄位缺失。
print(table(births14$habit,useNA='ifany'))
births <- births14[complete.cases(births14[c('weight','habit')]),]
births$habit <- factor(births$habit,levels=c('nonsmoker','smoker'))
ns <- births$weight[births$habit=='nonsmoker']
sm <- births$weight[births$habit=='smoker']
summary_one <- function(x) c(n=length(x),mean=mean(x),SD=sd(x))
print(rbind(nonsmoker=summary_one(ns),smoker=summary_one(sm)))
set.seed(1105)
png('assets/r4/births.png',width=1200,height=650,res=120)
par(mfrow=c(1,2),mar=c(4.5,4.5,2,1))
boxplot(weight~habit,data=births,col=c('grey85','#df9c64'),ylab='Birth weight (lb)',xlab='Smoking status')
stripchart(weight~habit,data=births,vertical=TRUE,method='jitter',add=TRUE,pch=16,cex=.35,col='#55555555')
hist(sm,breaks=seq(0,12,.5),col='#df9c64',xlim=c(0,12),main='Smoker',xlab='Birth weight (lb)')
dev.off()
# 2. 方向 nonsmoker - smoker；Welch 為 t.test 預設。
welch <- t.test(weight~habit,data=births)
print(welch)
sp <- sqrt(((length(ns)-1)*var(ns)+(length(sm)-1)*var(sm))/(length(ns)+length(sm)-2))
d <- (mean(ns)-mean(sm))/sp
print(c(pooled_SD=sp,Cohens_d=d))
se <- sqrt(var(ns)/length(ns)+var(sm)/length(sm))
manual_ci <- (mean(ns)-mean(sm))+c(-1,1)*qt(.975,welch$parameter)*se
stopifnot(isTRUE(all.equal(unname(welch$conf.int),manual_ci,check.attributes=FALSE)))
print(qt(.975,c(5,10,30,100)))
png('assets/r4/t_curves.png',width=1200,height=600,res=120)
curve(dnorm(x),-4,4,lwd=3,xlab='Standardized statistic',ylab='Density')
curve(dt(x,5),add=TRUE,col='#b65b13',lwd=3,lty=2)
curve(dt(x,30),add=TRUE,col='grey50',lwd=2,lty=3)
legend('topright',c('Standard normal','t: df=5','t: df=30'),lty=c(1,2,3),col=c('black','#b65b13','grey50'),lwd=2,bty='n')
dev.off()
# 3. 每列是一隻羊；同一隻羊 after - before。配對後才排除不完整列。
stem <- stem_cell[complete.cases(stem_cell[c('trmt','before','after')]),]
stem$change <- stem$after-stem$before
esc <- stem[stem$trmt=='esc',]
ctrl <- stem[stem$trmt=='ctrl',]
paired <- t.test(esc$after,esc$before,paired=TRUE)
as_diff <- t.test(esc$change)
print(paired)
stopifnot(isTRUE(all.equal(paired$p.value,as_diff$p.value)))
wrong <- t.test(esc$after,esc$before)
print(c(incorrect_independent_p=wrong$p.value))
between <- t.test(ctrl$change,esc$change)
print(between)
png('assets/r4/paired.png',width=1200,height=600,res=120)
par(mfrow=c(1,2),mar=c(4.5,4.5,2,1))
matplot(c(1,2),t(as.matrix(esc[c('before','after')])),type='b',lty=1,pch=16,col='grey40',xaxt='n',xlab='Measurement',ylab='Pumping capacity (%)')
axis(1,1:2,c('Before','After'))
stripchart(esc$change,pch=16,method='stack',xlab='After - before (percentage points)',main='ESC paired changes')
abline(v=0,lty=2,col='#b65b13');dev.off()
# 4. 完全隨機分派設計下的無個體處理效果假設；重排 trmt 標籤。
# 此虛無條件比僅兩組平均相等更強。模擬不是額外增加樣本。
set.seed(1105); B <- 10000
obs <- mean(ctrl$change)-mean(esc$change)
perm <- replicate(B,{
  g <- sample(stem$trmt)
  mean(stem$change[g=='ctrl'])-mean(stem$change[g=='esc'])
})
k <- sum(abs(perm)>=abs(obs))
p_perm <- (k+1)/(B+1)
print(c(observed=obs,B=B,extreme=k,plus_one_p=p_perm))
png('assets/r4/permutation.png',width=1000,height=550,res=120)
hist(perm,breaks=30,col='grey80',main='Randomized treatment labels',xlab='CTRL - ESC change (percentage points)')
abline(v=c(-abs(obs),abs(obs)),col='#b65b13',lwd=3);dev.off()
# 5. Wilcoxon 定位。獨立兩組用 rank-sum；配對用 signed-rank。
# exact=FALSE 明示近似法，小樣本下仍要說明近似及差值對稱等條件。
w_ind <- wilcox.test(weight~habit,data=births,exact=FALSE)
w_pair <- wilcox.test(esc$after,esc$before,paired=TRUE,exact=FALSE)
print(w_ind);print(w_pair)
# 6. 結論用原始單位、區間與推論界線；不要依 p 值挑分析。
results <- data.frame(analysis=c('births_Welch','ESC_paired','CTRL_minus_ESC_change'),
 estimate=c(mean(ns)-mean(sm),mean(esc$change),obs),
 t=c(unname(welch$statistic),unname(paired$statistic),unname(between$statistic)),
 df=c(unname(welch$parameter),unname(paired$parameter),unname(between$parameter)),
 low=c(welch$conf.int[1],paired$conf.int[1],between$conf.int[1]),
 high=c(welch$conf.int[2],paired$conf.int[2],between$conf.int[2]),
 p=c(welch$p.value,paired$p.value,between$p.value))
write.csv(results,'verification/r4_results.csv',row.names=FALSE)
write.csv(data.frame(pooled_SD=sp,d=d,permutation_extreme=k,permutation_p=p_perm,
 wilcox_ind_p=w_ind$p.value,wilcox_pair_p=w_pair$p.value),'verification/r4_extra.csv',row.names=FALSE)
stopifnot(nrow(births14)==1000,nrow(births)==981,length(ns)==867,length(sm)==114,
 nrow(esc)==9,nrow(ctrl)==9,abs(d-.4629858)<1e-6,
 abs(welch$p.value-.00020754009)<1e-9,abs(paired$p.value-.076839754)<1e-8)
# 驗證 R4 Slido：配對呼叫與差值等價、sample 不放回、Welch 預設。
stopifnot(isTRUE(all.equal(t.test(ns,sm)$p.value,welch$p.value)))
set.seed(1); stopifnot(identical(sort(sample(1:6)),1:6))
cat('PASS: all numeric and quiz-code checks\n')
print(sessionInfo())
