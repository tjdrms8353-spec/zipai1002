package com.zipai.web;

import com.zipai.domain.*;
import com.zipai.repository.*;
import com.zipai.service.AuthService;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController @RequestMapping("/api/community")
public class CommunityController {
    private final PostRepository posts; private final CommentRepository comments;
    private final AuthService auth; private final JdbcTemplate jdbc;
    public CommunityController(PostRepository p,CommentRepository c,AuthService a,JdbcTemplate j){posts=p;comments=c;auth=a;jdbc=j;}
    @GetMapping("/posts") @Transactional(readOnly=true) Map<String,Object> list(HttpSession s){User u=auth.required(s);
        return Map.of("items",posts.findByDeletedAtIsNullOrderByCreatedAtDesc().stream().map(p->post(p,u.id)).toList());}
    @PostMapping("/posts") @ResponseStatus(HttpStatus.CREATED)
    Map<String,Object> create(@RequestBody Map<String,Object>b,HttpSession s){User u=auth.required(s);
        String category=t(b,"category"),title=t(b,"title"),content=t(b,"content"),area=t(b,"area");
        int rating=category.equals("review")?number(b.get("rating")):0;
        if(!Set.of("review","tip","question","free").contains(category)||title.length()<2||title.length()>60||
            content.length()<2||content.length()>2000||area.length()>30||rating<0||rating>5)
            throw new ResponseStatusException(BAD_REQUEST,"게시글 입력 내용을 확인해 주세요.");
        CommunityPost p=new CommunityPost();p.author=u;p.category=category;p.title=title;p.content=content;p.area=area;p.rating=rating;
        posts.save(p);return Map.of("item",post(p,u.id));}
    @GetMapping("/posts/{id}") @Transactional
    Map<String,Object> detail(@PathVariable Long id,HttpSession s){User u=auth.required(s);
        CommunityPost p=posts.findByIdAndDeletedAtIsNull(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"게시글을 찾을 수 없습니다."));
        p.views++;return Map.of("item",post(p,u.id));}
    @PutMapping("/posts/{id}/like") @Transactional
    Map<String,Object> like(@PathVariable Long id,HttpSession s){User u=auth.required(s);
        if(posts.findByIdAndDeletedAtIsNull(id).isEmpty())throw new ResponseStatusException(NOT_FOUND,"게시글을 찾을 수 없습니다.");
        int added=jdbc.update("INSERT IGNORE INTO community_post_likes(post_id,user_id,created_at) VALUES(?,?,?)",id,u.id,LocalDateTime.now());
        Long count=jdbc.queryForObject("SELECT COUNT(*) FROM community_post_likes WHERE post_id=?",Long.class,id);
        return Map.of("liked",true,"added",added>0,"likes",count);}
    @GetMapping("/posts/{id}/comments")
    Map<String,Object> comments(@PathVariable Long id,HttpSession s){auth.required(s);
        return Map.of("items",comments.findByPostIdOrderByCreatedAtAsc(id).stream().map(this::comment).toList());}
    @PostMapping("/posts/{id}/comments") @ResponseStatus(HttpStatus.CREATED)
    Map<String,Object> comment(@PathVariable Long id,@RequestBody Map<String,Object>b,HttpSession s){User u=auth.required(s);
        CommunityPost p=posts.findByIdAndDeletedAtIsNull(id).orElseThrow(()->new ResponseStatusException(NOT_FOUND,"게시글을 찾을 수 없습니다."));
        String content=t(b,"content");if(content.isBlank()||content.length()>500)throw new ResponseStatusException(BAD_REQUEST,"댓글을 1~500자로 입력해 주세요.");
        CommunityComment c=new CommunityComment();c.post=p;c.author=u;c.content=content;comments.save(c);return Map.of("item",comment(c));}
    private Map<String,Object> post(CommunityPost p,Long uid){Long likes=jdbc.queryForObject("SELECT COUNT(*) FROM community_post_likes WHERE post_id=?",Long.class,p.id);
        Boolean liked=jdbc.queryForObject("SELECT COUNT(*)>0 FROM community_post_likes WHERE post_id=? AND user_id=?",Boolean.class,p.id,uid);
        // Map.entry는 값이 null이면 예외를 발생시킨다. 초기 버전에서 선택 항목을 null로
        // 저장한 게시글도 목록 전체를 깨뜨리지 않도록 응답 값을 안전하게 정규화한다.
        Map<String,Object> result=new LinkedHashMap<>();
        result.put("id",p.id);result.put("category",value(p.category));result.put("title",value(p.title));result.put("content",value(p.content));
        result.put("author",p.author==null?"탈퇴한 사용자":value(p.author.username));result.put("authorId",p.author==null?null:p.author.id);
        result.put("area",value(p.area));result.put("rating",p.rating);result.put("likes",likes==null?0:likes);result.put("views",p.views);
        result.put("commentCount",comments.countByPostId(p.id));result.put("liked",Boolean.TRUE.equals(liked));
        result.put("createdAt",p.createdAt);result.put("updatedAt",p.updatedAt==null?p.createdAt:p.updatedAt);return result;}
    private Map<String,Object> comment(CommunityComment c){return Map.of("id",c.id,"content",c.content,"author",c.author.username,"createdAt",c.createdAt);}
    private static String t(Map<String,Object>b,String k){return String.valueOf(b.getOrDefault(k,"")).trim();}
    private static String value(String value){return value==null?"":value;}
    private static int number(Object o){try{return Integer.parseInt(String.valueOf(o));}catch(Exception e){return -1;}}
}
