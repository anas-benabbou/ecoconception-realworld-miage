import { Component, Input, OnDestroy, HostListener } from "@angular/core";
import { ArticlesService } from "../../core/services/articles.service";
import { ArticleListConfig } from "../../core/models/article-list-config.model";
import { Article } from "../../core/models/article.model";
import { ArticlePreviewComponent } from "./article-preview.component";
import { NgClass, NgForOf, NgIf } from "@angular/common";
import { LoadingState } from "../../core/models/loading-state.model";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
  selector: "app-article-list",
  styleUrls: ["article-list.component.css"],
  templateUrl: "./article-list.component.html",
  imports: [ArticlePreviewComponent, NgForOf, NgClass, NgIf],
  standalone: true,
})
export class ArticleListComponent implements OnDestroy {
  query!: ArticleListConfig;
  results: Article[] = [];
  currentOffset = 0;
  loading = LoadingState.NOT_LOADED;
  LoadingState = LoadingState;
  allArticlesLoaded = false;
  destroy$ = new Subject<void>();

  @Input() limit!: number;
  @Input()
  set config(config: ArticleListConfig) {
    if (config) {
      this.query = config;
      this.currentOffset = 0;
      this.results = [];
      this.allArticlesLoaded = false;
      this.runQuery();
    }
  }

  constructor(private readonly articlesService: ArticlesService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("window:scroll", [])
  onScroll() {
    if (
      !this.allArticlesLoaded &&
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
      this.loading !== LoadingState.LOADING
    ) {
      this.runQuery();
    }
  }

  runQuery() {
    this.loading = LoadingState.LOADING;

    if (this.limit) {
      this.query.filters.limit = this.limit;
      this.query.filters.offset = this.currentOffset;
    }

    this.articlesService
      .query(this.query)
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        this.loading = LoadingState.LOADED;

        if (data.articles.length) {
          this.results = [...this.results, ...data.articles];
          this.currentOffset += this.limit;
        } else {
          this.allArticlesLoaded = true;
        }
      });
  }
}
