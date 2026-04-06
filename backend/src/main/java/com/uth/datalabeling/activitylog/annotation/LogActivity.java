package com.uth.datalabeling.activitylog.annotation;

import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
    public @interface LogActivity {
    String action();


}
