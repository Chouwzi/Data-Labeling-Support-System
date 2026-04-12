package com.uth.datalabeling.modules.activitylog.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
// Gắn annotation này lên method cần audit để Aspect tự ghi log.
public @interface LogActivity {

    String action();

    String description() default "";

    String entityType() default "";

    String entityIdParam() default "";
}