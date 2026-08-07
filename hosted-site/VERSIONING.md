# 版本管理

本项目使用 Git 保存每次可恢复的代码状态。

## 当前稳定基线

- 标签：`v1.0.0-public`
- 状态：首次公开发布并验证可访问

## 后续修改规则

1. 修改前从当前稳定版本创建新分支。
2. 每完成一个可验证的小阶段就提交一次。
3. 发布成功后创建新的版本标签，例如 `v1.1.0`。
4. 不提交 `node_modules`、构建缓存或部署压缩包。

## 查看版本

```powershell
git log --oneline --decorate --all
git tag --list
```

## 临时查看旧版本

```powershell
git switch --detach v1.0.0-public
```

查看完成后返回：

```powershell
git switch main
```

## 从旧版本恢复

推荐创建恢复分支，避免直接覆盖当前工作：

```powershell
git switch -c restore-v1.0.0 v1.0.0-public
```

恢复代码不会自动改变线上网站；重新构建、保存和部署该版本后，线上网站才会回退。
